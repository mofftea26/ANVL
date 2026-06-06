-- New simplified CMS model (code-owned landing pages). ADDITIVE.
--
-- The CMS no longer composes landing sections (drop-builder "acts"). It only:
--   1. Stores which code-owned landing page is active (cms_settings.active_landing_page_key)
--   2. Holds simple SEO / asset / theme config blobs
--   3. Keeps picker metadata for the available landing pages (landing_pages)
--
-- The storefront resolves the active key against the in-code registry
-- (src/features/landingPages/registry.ts), falling back to the default page.
--
-- Applied 2026-06-06 via Supabase MCP (idempotent: DROP-then-CREATE guards on
-- triggers/policies so `supabase db push` can re-run safely).

-- ---------------------------------------------------------------------------
-- cms_settings: singleton row of simple CMS configuration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_landing_page_key text NOT NULL DEFAULT 'the-oath',
  theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  asset_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.cms_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.cms_settings IS
  'Singleton CMS config: active code-owned landing page + SEO/asset/theme blobs. Public read; CMS-role write.';

DROP TRIGGER IF EXISTS cms_settings_touch_updated_at ON public.cms_settings;
CREATE TRIGGER cms_settings_touch_updated_at
  BEFORE UPDATE ON public.cms_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- landing_pages: picker metadata ONLY (not page content — that lives in code).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  preview_image text NOT NULL DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT landing_pages_key_unique UNIQUE (key)
);

COMMENT ON TABLE public.landing_pages IS
  'Metadata for code-owned landing pages (picker UI). Content is in the code registry, never here.';

DROP TRIGGER IF EXISTS landing_pages_touch_updated_at ON public.landing_pages;
CREATE TRIGGER landing_pages_touch_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- Seed the known pages (keys must match the in-code registry).
INSERT INTO public.landing_pages (key, name, description, preview_image, is_available)
VALUES (
  'the-oath',
  'Drop 01 — The Oath',
  'Static cinematic launch experience for ANVL Drop 01.',
  '/brand/the-oath-shape.svg',
  true
)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- storefront_publication: mirror the active key onto the anon-readable
-- singleton so SSR resolves the landing page in the existing single round-trip.
-- ---------------------------------------------------------------------------
ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS active_landing_page_key text NOT NULL DEFAULT 'the-oath';

COMMENT ON COLUMN public.storefront_publication.active_landing_page_key IS
  'Active code-owned landing page key for anon SSR. Mirrors cms_settings.active_landing_page_key.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cms_settings_select_all ON public.cms_settings;
CREATE POLICY cms_settings_select_all
  ON public.cms_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS cms_settings_update_editor ON public.cms_settings;
CREATE POLICY cms_settings_update_editor
  ON public.cms_settings
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

DROP POLICY IF EXISTS landing_pages_select_available ON public.landing_pages;
CREATE POLICY landing_pages_select_available
  ON public.landing_pages
  FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS landing_pages_select_cms ON public.landing_pages;
CREATE POLICY landing_pages_select_cms
  ON public.landing_pages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

DROP POLICY IF EXISTS landing_pages_write_admin ON public.landing_pages;
CREATE POLICY landing_pages_write_admin
  ON public.landing_pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (API roles)
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.cms_settings TO anon, authenticated;
GRANT UPDATE ON public.cms_settings TO authenticated;
GRANT SELECT ON public.landing_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.landing_pages TO authenticated;
