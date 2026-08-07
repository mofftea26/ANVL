-- Coming Soon site-mode config blob.
--
-- The CMS "Coming Soon" surface controls a pre-launch reveal page that, when
-- enabled, replaces every public storefront route (admin stays reachable).
-- The blob carries the master `enabled` toggle plus the page's copy, countdown,
-- CTA/email-capture config, media-id asset refs, and SEO overrides. It is NOT
-- color — the page derives color from the active theme's CSS variables.
--
-- Stored as jsonb on both singletons, mirroring `shop_config` / `landing_content`:
--   cms_settings.coming_soon           = editor source of truth (CMS-role write)
--   storefront_publication.coming_soon = anon-readable published mirror
-- Zod-validated client-side (comingSoon.zod.ts); code defaults fill gaps, so
-- '{}' is a valid value (mode off, designed default copy). RLS is unchanged:
-- each column inherits its table's existing policies (public read / editor write).
-- Applied 2026-07-09 via Supabase MCP.

alter table public.cms_settings
  add column if not exists coming_soon jsonb not null default '{}'::jsonb;

alter table public.storefront_publication
  add column if not exists coming_soon jsonb not null default '{}'::jsonb;

comment on column cms_settings.coming_soon is
  'Coming Soon site-mode config (enabled toggle + reveal-page content/SEO). Zod-validated client-side; code defaults fill gaps.';
comment on column storefront_publication.coming_soon is
  'Published mirror of cms_settings.coming_soon (anon-readable).';
