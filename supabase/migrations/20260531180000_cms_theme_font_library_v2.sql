-- Theme and font config remain in cms_settings.theme_config / font_config (jsonb).
-- v2 shapes:
--   theme_config: { activeThemeId, themes: [{ id, name, appearance, palette }] }
--   font_config: { sans, heading, display, library: [{ id, label, source }] }
-- Storefront reads resolved active theme + font library from storefront_publication.

COMMENT ON COLUMN cms_settings.theme_config IS 'Theme library v2 — activeThemeId + themes[]';
COMMENT ON COLUMN cms_settings.font_config IS 'Font library — role ids + library[] with google/upload/system sources';
COMMENT ON COLUMN storefront_publication.theme_config IS 'Published theme library v2';
COMMENT ON COLUMN storefront_publication.font_config IS 'Published font library for storefront @font-face loading';
