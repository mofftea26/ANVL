-- Legal + Support content blobs.
--
-- The CMS "Legal" and "Support" surfaces control the copy for the site's
-- policy pages (Privacy, Terms, Cookies, Accessibility) and its customer-help
-- pages (FAQ, Contact, Shipping, Returns, Care guide, Size guide). Each blob
-- carries per-page copy — titles, intros, section lists, and (for the guides)
-- per-product care/size entries keyed by commerce product slug.
--
-- Stored as jsonb on both singletons, mirroring `banner_config` / `coming_soon`:
--   cms_settings.{legal,support}_content           = editor source of truth (CMS-role write)
--   storefront_publication.{legal,support}_content = anon-readable published mirror
-- Zod-validated client-side (legalContent.zod.ts / supportContent.zod.ts); code
-- defaults fill every blank field at render, so '{}' is a valid value (page runs
-- entirely on the designed defaults). RLS is unchanged: each column inherits its
-- table's existing policies (public read / editor write).

alter table public.cms_settings
  add column if not exists legal_content jsonb not null default '{}'::jsonb;
alter table public.cms_settings
  add column if not exists support_content jsonb not null default '{}'::jsonb;

alter table public.storefront_publication
  add column if not exists legal_content jsonb not null default '{}'::jsonb;
alter table public.storefront_publication
  add column if not exists support_content jsonb not null default '{}'::jsonb;

comment on column cms_settings.legal_content is
  'Legal pages copy (privacy/terms/cookies/accessibility). Zod-validated client-side; code defaults fill blank fields.';
comment on column cms_settings.support_content is
  'Support pages copy (faq/contact/shipping/returns/care/size + per-product care/size by slug). Zod-validated client-side; code defaults fill blank fields.';
comment on column storefront_publication.legal_content is
  'Published mirror of cms_settings.legal_content (anon-readable).';
comment on column storefront_publication.support_content is
  'Published mirror of cms_settings.support_content (anon-readable).';
