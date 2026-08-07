-- ANVL Gamification rules — ranks, rank levels, challenges, badges, XP settings.
-- Moves the Armory's hardcoded rules into editable relational tables
-- (admin /admin/gamification). Rules are PUBLIC data (the storefront ladder /
-- challenge log shows them to everyone): anon reads, editors/admins write.
-- The seed below mirrors the code defaults exactly, so a fresh DB behaves
-- identically to the pre-migration hardcoded values.

-- ---------------------------------------------------------------------------
-- gamification_settings (singleton id=1 — Forge XP constants + level curve)
-- ---------------------------------------------------------------------------
CREATE TABLE public.gamification_settings (
  id int PRIMARY KEY CHECK (id = 1),
  xp_per_registration int NOT NULL DEFAULT 100 CHECK (xp_per_registration >= 0),
  xp_per_wear int NOT NULL DEFAULT 5 CHECK (xp_per_wear >= 0),
  xp_per_feat int NOT NULL DEFAULT 20 CHECK (xp_per_feat >= 0),
  xp_per_full_drop int NOT NULL DEFAULT 200 CHECK (xp_per_full_drop >= 0),
  -- Cumulative XP to reach level L = factor * L * (L - 1).
  level_curve_factor int NOT NULL DEFAULT 75 CHECK (level_curve_factor > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gamification_settings IS
  'Singleton Forge XP constants + level curve. Public read; editor write.';

CREATE TRIGGER gamification_settings_touch_updated_at
  BEFORE UPDATE ON public.gamification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- gamification_ranks (the four fixed rank identities — copy + emblem editable)
-- ---------------------------------------------------------------------------
CREATE TABLE public.gamification_ranks (
  key text PRIMARY KEY CHECK (key IN ('initiate', 'forged', 'oathbound', 'warlord')),
  sort_order int NOT NULL DEFAULT 0,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  -- Public URL override for the emblem; NULL -> code-owned /brand/ranks/{key}.png.
  emblem_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gamification_ranks IS
  'Armory rank identities (fixed keys; copy/emblem/thresholds editable).';

CREATE TRIGGER gamification_ranks_touch_updated_at
  BEFORE UPDATE ON public.gamification_ranks
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- gamification_rank_levels (I–III per rank; AND-combined nullable thresholds)
-- ---------------------------------------------------------------------------
CREATE TABLE public.gamification_rank_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_key text NOT NULL REFERENCES public.gamification_ranks (key) ON DELETE CASCADE,
  level int NOT NULL CHECK (level BETWEEN 1 AND 3),
  unlock_copy text NOT NULL DEFAULT '',
  -- Thresholds AND-combine; NULL = not required for this level.
  min_registrations int NULL CHECK (min_registrations >= 0),
  min_full_drops int NULL CHECK (min_full_drops >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rank_key, level)
);

COMMENT ON TABLE public.gamification_rank_levels IS
  'Per-level unlock thresholds. Derivation: order by (rank sort_order, level) DESC, first row whose non-null thresholds all hold wins.';

CREATE TRIGGER gamification_rank_levels_touch_updated_at
  BEFORE UPDATE ON public.gamification_rank_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- gamification_challenges (the quest log — declarative metric + target)
-- ---------------------------------------------------------------------------
CREATE TABLE public.gamification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('forge', 'ritual', 'record', 'honor')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  metric text NOT NULL CHECK (metric IN
    ('registrations', 'total_wears', 'max_wears', 'feat_count', 'full_drops', 'honor_pinned')),
  target int NOT NULL CHECK (target > 0),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gamification_challenges_sort_idx
  ON public.gamification_challenges (sort_order);

COMMENT ON TABLE public.gamification_challenges IS
  'Armory challenges: progress = min(metric(ctx), target). Declarative metrics only.';

CREATE TRIGGER gamification_challenges_touch_updated_at
  BEFORE UPDATE ON public.gamification_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- gamification_badges (milestone badges — same metric vocabulary)
-- ---------------------------------------------------------------------------
CREATE TABLE public.gamification_badges (
  key text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  metric text NOT NULL CHECK (metric IN
    ('registrations', 'total_wears', 'max_wears', 'feat_count', 'full_drops', 'honor_pinned')),
  target int NOT NULL DEFAULT 1 CHECK (target > 0),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gamification_badges IS
  'Milestone badges earned when metric >= target. NO serial-number mechanics.';

CREATE TRIGGER gamification_badges_touch_updated_at
  BEFORE UPDATE ON public.gamification_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — rules are public data; editors/admins write.
-- ---------------------------------------------------------------------------
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rank_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'gamification_settings',
    'gamification_ranks',
    'gamification_rank_levels',
    'gamification_challenges',
    'gamification_badges'
  ] LOOP
    EXECUTE format($f$
      CREATE POLICY %1$I_select_public
        ON public.%1$I
        FOR SELECT
        TO public
        USING (true);
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY %1$I_insert_editor
        ON public.%1$I
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
          )
        );
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY %1$I_update_editor
        ON public.%1$I
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
          )
        );
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY %1$I_delete_editor
        ON public.%1$I
        FOR DELETE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
          )
        );
    $f$, t);
    EXECUTE format('GRANT SELECT ON public.%1$I TO anon, authenticated;', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%1$I TO authenticated;', t);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Seed — EXACT mirror of the pre-migration hardcoded rules.
-- ---------------------------------------------------------------------------
INSERT INTO public.gamification_settings (id) VALUES (1);

INSERT INTO public.gamification_ranks (key, sort_order, name, description) VALUES
  ('initiate', 0, 'Initiate', 'The forge has noticed you.'),
  ('forged', 1, 'Forged', 'Steel with your name on it.'),
  ('oathbound', 2, 'Oathbound', 'The oath holds — piece by piece.'),
  ('warlord', 3, 'Warlord', 'A full drop stands forged in your armory.');

INSERT INTO public.gamification_rank_levels
  (rank_key, level, unlock_copy, min_registrations, min_full_drops) VALUES
  ('initiate', 1, 'Begin your armory', NULL, NULL),
  ('initiate', 2, 'Register 1 piece', 1, NULL),
  ('initiate', 3, 'Register 2 pieces', 2, NULL),
  ('forged', 1, 'Register 3 pieces', 3, NULL),
  ('forged', 2, 'Register 4 pieces', 4, NULL),
  ('forged', 3, 'Register 5 pieces', 5, NULL),
  ('oathbound', 1, 'Register 6 pieces', 6, NULL),
  ('oathbound', 2, 'Register 8 pieces', 8, NULL),
  ('oathbound', 3, 'Register 10 pieces', 10, NULL),
  ('warlord', 1, 'Complete a full drop', NULL, 1),
  ('warlord', 2, 'A full drop + 12 pieces', 12, 1),
  ('warlord', 3, 'Complete two drops', NULL, 2);

INSERT INTO public.gamification_challenges
  (key, category, title, description, metric, target, sort_order) VALUES
  ('first-strike', 'forge', 'First Strike', 'Register your first piece.', 'registrations', 1, 0),
  ('loadout', 'forge', 'Full Loadout', 'Register three pieces.', 'registrations', 3, 1),
  ('battle-worn', 'ritual', 'Battle-Worn', 'Log 25 wears across your armory.', 'total_wears', 25, 2),
  ('devotion', 'ritual', 'Devotion', 'Train in a single piece 20 times.', 'max_wears', 20, 3),
  ('record-keeper', 'record', 'Record Keeper', 'Log five feats.', 'feat_count', 5, 4),
  ('curator', 'honor', 'Curator', 'Fill all three Hall of Honor slots.', 'honor_pinned', 3, 5),
  ('warlord', 'forge', 'Warlord', 'Complete a full drop.', 'full_drops', 1, 6);

INSERT INTO public.gamification_badges
  (key, title, description, metric, target, sort_order) VALUES
  ('first-claim', 'First Strike', 'Registered your first passport.', 'registrations', 1, 0),
  ('full-drop', 'Drop Complete', 'Every piece of a drop, registered.', 'full_drops', 1, 1);
