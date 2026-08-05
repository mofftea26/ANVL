-- Per-product PDP editorial content.
--
-- The new CMS "Products" surface authors the non-commerce parts of the product
-- detail page (the bento story / material / care / details copy and the
-- per-product editorial assets) keyed by product slug. Commerce data
-- (name/price/variants/images) stays on the product (Shopify later) — this blob
-- only supplies the editorial layer.
--
-- Stored as jsonb `{ [slug]: {...} }` on both singletons, mirroring
-- `landing_content` / `shop_config`:
--   cms_settings.pdp_content           = editor source of truth (CMS-role write)
--   storefront_publication.pdp_content = anon-readable published mirror
-- Zod-validated client-side (pdpContent.zod.ts); code/product fields fill gaps,
-- so '{}' is valid. RLS unchanged (column inherits each table's policies).

alter table public.cms_settings
  add column if not exists pdp_content jsonb not null default '{}'::jsonb;

alter table public.storefront_publication
  add column if not exists pdp_content jsonb not null default '{}'::jsonb;

comment on column cms_settings.pdp_content is
  'Per-product PDP editorial content { [slug]: {...} }. Zod-validated client-side; product fields + code defaults fill gaps.';
comment on column storefront_publication.pdp_content is
  'Published mirror of cms_settings.pdp_content (anon-readable).';
