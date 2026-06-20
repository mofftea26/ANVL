-- Remove per-landing-page theme assignment — single global theme.
--
-- The storefront now resolves one theme from `theme_config.activeThemeId` and
-- applies it to every surface. The active landing page no longer influences the
-- palette, so the `landingPageThemes` map inside `theme_config` (jsonb) is dead.
--
-- This strips the key from the singleton rows (idempotent). Any non-empty
-- assignment is discarded; affected pages fall back to the global active theme.
-- Set the desired preset as the live theme in /admin/theme before/after if a
-- page previously relied on a different assigned preset. theme_config is jsonb,
-- so no column/table change is required. Superseded by this migration:
-- 20260615120000_theme_landing_page_assignment.sql.

update public.cms_settings
set theme_config = theme_config - 'landingPageThemes'
where id = 1
  and jsonb_typeof(theme_config) = 'object'
  and theme_config ? 'landingPageThemes';

update public.storefront_publication
set theme_config = theme_config - 'landingPageThemes'
where id = 1
  and jsonb_typeof(theme_config) = 'object'
  and theme_config ? 'landingPageThemes';

comment on column cms_settings.theme_config is
  'Theme library v2 — activeThemeId + themes[] (single global theme)';
comment on column storefront_publication.theme_config is
  'Published theme library v2 — activeThemeId + themes[] (single global theme)';
