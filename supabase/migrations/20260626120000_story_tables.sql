-- ANVL Story saga: chapters -> acts -> cast.
-- Relational CMS content (not the singleton cms_settings JSON pattern).
-- Anon reads published rows only; CMS roles read all; editors/admins write.

-- ---------------------------------------------------------------------------
-- story_chapters (each chapter ~ a drop)
-- ---------------------------------------------------------------------------
CREATE TABLE public.story_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  chapter_number int NOT NULL DEFAULT 1,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover_asset jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX story_chapters_sort_order_idx ON public.story_chapters (sort_order);
CREATE INDEX story_chapters_published_idx ON public.story_chapters (is_published);

COMMENT ON TABLE public.story_chapters IS
  'Story saga chapters (one per drop). Anon reads published rows only.';

CREATE TRIGGER story_chapters_touch_updated_at
  BEFORE UPDATE ON public.story_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- story_acts (ordered story beats within a chapter)
-- ---------------------------------------------------------------------------
CREATE TABLE public.story_acts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.story_chapters (id) ON DELETE CASCADE,
  act_number int NOT NULL DEFAULT 1,
  title text NOT NULL,
  story text NOT NULL DEFAULT '',
  asset jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX story_acts_chapter_idx ON public.story_acts (chapter_id, sort_order);

COMMENT ON TABLE public.story_acts IS
  'Ordered story beats inside a chapter. Published when parent chapter is published.';

CREATE TRIGGER story_acts_touch_updated_at
  BEFORE UPDATE ON public.story_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- story_cast (authored characters; chapter-level or act-level)
-- ---------------------------------------------------------------------------
CREATE TABLE public.story_cast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.story_chapters (id) ON DELETE CASCADE,
  act_id uuid REFERENCES public.story_acts (id) ON DELETE CASCADE,
  name text NOT NULL,
  rank text NOT NULL DEFAULT 'Recruit',
  blurb text NOT NULL DEFAULT '',
  avatar_asset jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX story_cast_chapter_idx ON public.story_cast (chapter_id, act_id, sort_order);

COMMENT ON TABLE public.story_cast IS
  'CMS-authored characters (generals/recruits/loyal members) shown in the story.';

CREATE TRIGGER story_cast_touch_updated_at
  BEFORE UPDATE ON public.story_cast
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_cast ENABLE ROW LEVEL SECURITY;

-- Helper predicates are inlined to keep the policies self-contained.

-- story_chapters --------------------------------------------------------------
CREATE POLICY story_chapters_select_public
  ON public.story_chapters
  FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY story_chapters_select_cms
  ON public.story_chapters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY story_chapters_insert_editor
  ON public.story_chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY story_chapters_update_editor
  ON public.story_chapters
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

CREATE POLICY story_chapters_delete_editor
  ON public.story_chapters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- story_acts ------------------------------------------------------------------
CREATE POLICY story_acts_select_public
  ON public.story_acts
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.story_chapters AS c
      WHERE c.id = chapter_id AND c.is_published = true
    )
  );

CREATE POLICY story_acts_select_cms
  ON public.story_acts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY story_acts_insert_editor
  ON public.story_acts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY story_acts_update_editor
  ON public.story_acts
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

CREATE POLICY story_acts_delete_editor
  ON public.story_acts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- story_cast ------------------------------------------------------------------
CREATE POLICY story_cast_select_public
  ON public.story_cast
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.story_chapters AS c
      WHERE c.id = chapter_id AND c.is_published = true
    )
  );

CREATE POLICY story_cast_select_cms
  ON public.story_cast
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY story_cast_insert_editor
  ON public.story_cast
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY story_cast_update_editor
  ON public.story_cast
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

CREATE POLICY story_cast_delete_editor
  ON public.story_cast
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (RLS still governs row visibility)
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.story_chapters TO anon, authenticated;
GRANT SELECT ON public.story_acts TO anon, authenticated;
GRANT SELECT ON public.story_cast TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_chapters TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_acts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_cast TO authenticated;
