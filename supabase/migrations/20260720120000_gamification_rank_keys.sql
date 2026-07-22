-- ---------------------------------------------------------------------------
-- Gamification ranks: allow custom rank keys (D5 — rank create/delete).
--
-- Current schema: `gamification_ranks.key` is the PRIMARY KEY with an inline
--   CHECK (key IN ('initiate', 'forged', 'oathbound', 'warlord'))
-- (auto-named `gamification_ranks_key_check`), locking the ladder to the four
-- seeded identities.
--
-- Target schema: the CHECK is dropped so the admin can create and delete
-- ranks. Everything else stays:
--   - `key` remains the PRIMARY KEY (uniqueness + not-null preserved);
--   - `gamification_rank_levels.rank_key` keeps its FK with ON DELETE CASCADE,
--     so deleting a rank removes its level rows atomically;
--   - RLS policies are key-agnostic (public SELECT, editor/admin write) and
--     need no change;
--   - the storefront schema widened `rank key` from the enum to a free string
--     in the same change set (`gamification.schema.ts`), with the code-owned
--     emblem fallback applying to seed keys only.
--
-- Risks: none to existing data (the four seed rows satisfy any key shape).
--   Non-seed ranks created after this migration have no code-owned emblem
--   PNG; the storefront falls back to the neutral brand mark until an
--   `emblem_url` is assigned.
--
-- Rollback:
--   ALTER TABLE public.gamification_ranks
--     ADD CONSTRAINT gamification_ranks_key_check
--     CHECK (key IN ('initiate', 'forged', 'oathbound', 'warlord'));
--   (Only valid after deleting any custom ranks.)
-- ---------------------------------------------------------------------------

ALTER TABLE public.gamification_ranks
  DROP CONSTRAINT IF EXISTS gamification_ranks_key_check;

COMMENT ON TABLE public.gamification_ranks IS
  'Armory rank identities (admin-managed keys; copy/emblem/thresholds editable).';
