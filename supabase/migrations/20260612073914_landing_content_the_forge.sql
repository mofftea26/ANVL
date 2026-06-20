-- Landing content: per-landing-key CMS-editable copy blobs.
-- Code defaults fill every gap client-side; empty blob = fully code-owned copy.

ALTER TABLE public.cms_settings
  ADD COLUMN IF NOT EXISTS landing_content jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS landing_content jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.cms_settings.landing_content IS
  'Per-landing-key content blobs { [key]: {...} }. Zod-validated client-side; code defaults fill gaps.';
COMMENT ON COLUMN public.storefront_publication.landing_content IS
  'Published mirror of cms_settings.landing_content (anon-readable).';

-- Picker row for the new code-owned landing page.
INSERT INTO public.landing_pages (key, name, description, preview_image, is_available)
VALUES (
  'the-forge',
  'Drop 01 — The Forge',
  'Generative WebGL cinematic experience for Drop 01.',
  '/brand/the-oath-shape.svg',
  true
)
ON CONFLICT (key) DO NOTHING;
