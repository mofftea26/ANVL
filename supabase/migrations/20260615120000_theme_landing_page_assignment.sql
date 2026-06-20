-- Per-landing-page theme assignment.
--
-- The assignment map lives inside the existing `theme_config` (jsonb) under the
-- key `landingPageThemes`: { [landingPageKey]: themePresetId }. The storefront
-- uses the assigned preset whenever that page is the active drop; when a page
-- has no assignment it falls back to the live active theme plus the page's
-- code-owned palette defaults.
--
-- theme_config is jsonb, so no column/table change is required. This migration
-- backfills the key on the singleton rows (idempotent) and documents the shape.

update public.cms_settings
set theme_config = jsonb_set(theme_config, '{landingPageThemes}', '{}'::jsonb, true)
where id = 1
  and jsonb_typeof(theme_config) = 'object'
  and not (theme_config ? 'landingPageThemes');

update public.storefront_publication
set theme_config = jsonb_set(theme_config, '{landingPageThemes}', '{}'::jsonb, true)
where id = 1
  and jsonb_typeof(theme_config) = 'object'
  and not (theme_config ? 'landingPageThemes');

comment on column cms_settings.theme_config is
  'Theme library v2 — activeThemeId + themes[] + landingPageThemes{landingKey:themeId}';
comment on column storefront_publication.theme_config is
  'Published theme library v2 (incl. landingPageThemes assignment map)';
