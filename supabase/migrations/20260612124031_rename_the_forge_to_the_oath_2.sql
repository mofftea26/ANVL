-- Public identity rename: 'the-forge' → 'the-oath-2' (Drop 01 — The Oath II).
-- Code folder keeps its original codename; only the registry key changes.

UPDATE public.landing_pages
SET key = 'the-oath-2',
    name = 'Drop 01 — The Oath II',
    description = 'Oath-hall WebGL cinematic experience for Drop 01.'
WHERE key = 'the-forge'
  AND NOT EXISTS (SELECT 1 FROM public.landing_pages WHERE key = 'the-oath-2');

-- Move any keyed config blobs to the new key (no-ops when absent).
UPDATE public.cms_settings
SET landing_content = (landing_content - 'the-forge')
      || jsonb_build_object('the-oath-2', landing_content->'the-forge')
WHERE landing_content ? 'the-forge';

UPDATE public.storefront_publication
SET landing_content = (landing_content - 'the-forge')
      || jsonb_build_object('the-oath-2', landing_content->'the-forge')
WHERE landing_content ? 'the-forge';

UPDATE public.cms_settings
SET asset_config = jsonb_set(
      asset_config - ARRAY[]::text[],
      '{drops}',
      (COALESCE(asset_config->'drops', '{}'::jsonb) - 'the-forge')
        || jsonb_build_object('the-oath-2', asset_config->'drops'->'the-forge')
    )
WHERE asset_config->'drops' ? 'the-forge';

UPDATE public.storefront_publication
SET asset_config = jsonb_set(
      asset_config - ARRAY[]::text[],
      '{drops}',
      (COALESCE(asset_config->'drops', '{}'::jsonb) - 'the-forge')
        || jsonb_build_object('the-oath-2', asset_config->'drops'->'the-forge')
    )
WHERE asset_config->'drops' ? 'the-forge';
