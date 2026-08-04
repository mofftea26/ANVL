-- CMS-editable SEO + analytics/marketing tags blob, mirroring the existing
-- singleton-blob pattern (banner_config/legal_content/etc). Additive: default
-- '{}' so existing rows are valid; RLS on both tables already covers all
-- columns (public SELECT, editor UPDATE), so no new policies are needed.
alter table public.cms_settings
  add column if not exists site_seo jsonb not null default '{}'::jsonb;

alter table public.storefront_publication
  add column if not exists site_seo jsonb not null default '{}'::jsonb;

comment on column public.storefront_publication.site_seo is
  'Global SEO defaults + per-page SEO + marketing/analytics tags (GA4/GTM/Meta Pixel/Hotjar/verification). Public read; editor write. Mirrors the other CMS blobs.';
