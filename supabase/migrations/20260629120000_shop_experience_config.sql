-- Shop Experience config blob.
--
-- The new CMS "Shop Experience" surface controls the /shop page layout,
-- behavior, and copy (heading/intro, grid density + columns, default sort,
-- filter order/visibility, card style/animation/aspect, quick-view/quick-add
-- toggles, price/badge/swatch/size visibility, spacing, animation multiplier,
-- empty/no-results copy, editorial banner). It is NOT color — the shop derives
-- all color from the active theme's derived `--shop-*` tokens.
--
-- Stored as jsonb on both singletons, mirroring `theme_config` / `landing_content`:
--   cms_settings.shop_config           = editor source of truth (CMS-role write)
--   storefront_publication.shop_config = anon-readable published mirror
-- Zod-validated client-side (shopExperience.zod.ts); code defaults fill gaps, so
-- '{}' is a valid value. RLS is unchanged: each column inherits its table's
-- existing policies (public read / editor write).

alter table public.cms_settings
  add column if not exists shop_config jsonb not null default '{}'::jsonb;

alter table public.storefront_publication
  add column if not exists shop_config jsonb not null default '{}'::jsonb;

comment on column cms_settings.shop_config is
  'Shop Experience config (layout/behavior/copy for /shop). Zod-validated client-side; code defaults fill gaps.';
comment on column storefront_publication.shop_config is
  'Published mirror of cms_settings.shop_config (anon-readable).';
