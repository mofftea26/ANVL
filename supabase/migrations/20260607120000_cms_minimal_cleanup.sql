-- CMS minimal cleanup: slim storefront_publication, drop product tables,
-- wire theme/font/asset config on cms_settings + publication mirror.

-- ---------------------------------------------------------------------------
-- cms_settings: add font_config, drop seo_config, seed defaults
-- ---------------------------------------------------------------------------
ALTER TABLE public.cms_settings
  ADD COLUMN IF NOT EXISTS font_config jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.cms_settings
  DROP COLUMN IF EXISTS seo_config;

-- Reshape asset_config default
ALTER TABLE public.cms_settings
  ALTER COLUMN asset_config SET DEFAULT '{"general": {}, "drops": {}}'::jsonb;

UPDATE public.cms_settings
SET
  theme_config = COALESCE(
    NULLIF(theme_config, '{}'::jsonb),
    '{
      "dataTheme": "oath-dark",
      "palette": {
        "anvlBlack": "#0b0b0c",
        "anvlDarkSteelGrey": "#1d1f21",
        "anvlWashedCharcoal": "#34373a",
        "anvlGraphite": "#5b5e61",
        "anvlBone": "#e7e4df",
        "colorBg": "#0b0b0c",
        "colorSurface": "#121315",
        "colorSurfaceSoft": "#161820",
        "colorSurfaceElevated": "#1a1c1f",
        "colorLine": "rgba(231, 228, 223, 0.14)",
        "colorText": "#f5f4f2",
        "colorTextMuted": "#bab8b3",
        "colorHeading": "#e7e4df",
        "colorAccent": "#c7c2b8",
        "colorChip": "rgba(52, 55, 58, 0.9)",
        "colorHeroGlow": "rgba(231, 228, 223, 0.08)",
        "colorEmber": "#c2703d",
        "colorEmberBright": "#e08a4a",
        "colorEmberSoft": "rgba(194, 112, 61, 0.16)"
      }
    }'::jsonb
  ),
  font_config = COALESCE(
    NULLIF(font_config, '{}'::jsonb),
    '{
      "sans": "Sora",
      "heading": "Anton",
      "display": "Cinzel"
    }'::jsonb
  ),
  asset_config = CASE
    WHEN asset_config = '{}'::jsonb OR asset_config IS NULL
      THEN '{"general": {}, "drops": {}}'::jsonb
    WHEN asset_config ? 'general' THEN asset_config
    ELSE jsonb_build_object('general', asset_config, 'drops', '{}'::jsonb)
  END
WHERE id = 1;

-- ---------------------------------------------------------------------------
-- storefront_publication: add mirror columns, drop legacy columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS theme_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS font_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS asset_config jsonb NOT NULL DEFAULT '{"general": {}, "drops": {}}'::jsonb;

UPDATE public.storefront_publication AS p
SET
  theme_config = s.theme_config,
  font_config = s.font_config,
  asset_config = s.asset_config
FROM public.cms_settings AS s
WHERE p.id = 1 AND s.id = 1;

ALTER TABLE public.storefront_publication
  DROP COLUMN IF EXISTS website_layout,
  DROP COLUMN IF EXISTS site_seo,
  DROP COLUMN IF EXISTS products_snapshot,
  DROP COLUMN IF EXISTS catalog_drop_index,
  DROP COLUMN IF EXISTS global_brand,
  DROP COLUMN IF EXISTS campaigns,
  DROP COLUMN IF EXISTS lookbook,
  DROP COLUMN IF EXISTS legacy_landing_cms,
  DROP COLUMN IF EXISTS site_homepage,
  DROP COLUMN IF EXISTS shopify_catalog_synced_at;

COMMENT ON COLUMN public.storefront_publication.theme_config IS
  'Mirrors cms_settings.theme_config — palette + dataTheme for anon SSR.';
COMMENT ON COLUMN public.storefront_publication.font_config IS
  'Mirrors cms_settings.font_config — sans/heading/display font families.';
COMMENT ON COLUMN public.storefront_publication.asset_config IS
  'Mirrors cms_settings.asset_config — general + per-drop media slot assignments.';

-- ---------------------------------------------------------------------------
-- Drop product tables (commerce via Shopify or seed)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.shopify_product_links;
DROP TABLE IF EXISTS public.cms_admin_products;
