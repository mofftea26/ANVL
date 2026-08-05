-- Per-product PASSPORT content.
--
-- The CMS "Passports" surface gains a multi-step wizard authoring the
-- editorial layer of the /p/$token passport experience — one wizard step per
-- passport SECTION (identity, piece, material, care, details, origin), each
-- with its own copy + asset references — keyed by product slug.
--
-- Stored as jsonb `{ [slug]: {...} }` on both singletons, mirroring
-- `pdp_content`:
--   cms_settings.passport_content           = editor source of truth
--   storefront_publication.passport_content = anon-readable published mirror
-- Zod-validated client-side (passportContent.zod.ts); pdp_content + product
-- fields + code defaults fill gaps, so '{}' is valid. RLS unchanged (column
-- inherits each table's policies).
-- Applied 2026-07-14 via Supabase MCP.

alter table public.cms_settings
  add column if not exists passport_content jsonb not null default '{}'::jsonb;

alter table public.storefront_publication
  add column if not exists passport_content jsonb not null default '{}'::jsonb;

comment on column cms_settings.passport_content is
  'Per-product passport section content { [slug]: {...} }. Zod-validated client-side; pdp_content/product fields + code defaults fill gaps.';
comment on column storefront_publication.passport_content is
  'Published mirror of cms_settings.passport_content (anon-readable).';
