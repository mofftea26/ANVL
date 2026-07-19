-- Storefront announcement banner config blob.
--
-- The CMS "Banner" surface controls a slim announcement strip rendered at the
-- very top of every storefront page (above the topbar) while live. The blob
-- carries the master `enabled` toggle plus the message, optional link/CTA,
-- optional leading image media id, hex color overrides (blank = theme
-- tokens), and an optional start/end schedule window.
--
-- Stored as jsonb on both singletons, mirroring `coming_soon` / `shop_config`:
--   cms_settings.banner_config           = editor source of truth (CMS-role write)
--   storefront_publication.banner_config = anon-readable published mirror
-- Zod-validated client-side (bannerConfig.zod.ts); code defaults fill gaps, so
-- '{}' is a valid value (banner off). RLS is unchanged: each column inherits
-- its table's existing policies (public read / editor write).

alter table public.cms_settings
  add column if not exists banner_config jsonb not null default '{}'::jsonb;

alter table public.storefront_publication
  add column if not exists banner_config jsonb not null default '{}'::jsonb;

comment on column cms_settings.banner_config is
  'Storefront announcement banner config (enabled toggle + message/link/image/colors/schedule). Zod-validated client-side; code defaults fill gaps.';
comment on column storefront_publication.banner_config is
  'Published mirror of cms_settings.banner_config (anon-readable).';
