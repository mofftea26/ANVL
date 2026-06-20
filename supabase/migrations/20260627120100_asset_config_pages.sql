-- Per-storefront-page asset assignments.
--
-- The CMS Assets editor now exposes code-defined asset slots for every
-- storefront page (shop, pdp, cart, checkout, about, contact, auth, account,
-- size-guide, care-guide, legal, …) in addition to the site-wide `general`
-- slots and per-landing-page `drops`. Assignments live inside the existing
-- `asset_config` (jsonb) under a new `pages` key: { [pageKey]: { slot: mediaId } }.
--
-- asset_config is jsonb, so no column/table change is required. This backfills
-- the key on the singleton rows (idempotent) and documents the shape.

update public.cms_settings
set asset_config = jsonb_set(asset_config, '{pages}', '{}'::jsonb, true)
where id = 1
  and jsonb_typeof(asset_config) = 'object'
  and not (asset_config ? 'pages');

update public.storefront_publication
set asset_config = jsonb_set(asset_config, '{pages}', '{}'::jsonb, true)
where id = 1
  and jsonb_typeof(asset_config) = 'object'
  and not (asset_config ? 'pages');

comment on column cms_settings.asset_config is
  'Asset slot assignments — { general{}, drops{landingKey:{slot:mediaId}}, pages{pageKey:{slot:mediaId}} }';
comment on column storefront_publication.asset_config is
  'Published asset slot assignments — { general{}, drops{}, pages{} }';
