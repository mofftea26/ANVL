-- Consolidate the two Drop 01 landing pages into a single key: 'the-oath'.
-- The merged storefront page (TheOathLanding) now owns Oath I's video hero +
-- product reveal AND Oath II's 3D logo, particles, manifesto, tenets, finale.
-- 'the-oath-2' is retired everywhere.

-- 1) Merge the extra Oath II asset slots (chapterMedia1-4, manifestoMedia, …)
--    into the 'the-oath' drop. Existing 'the-oath' values win on conflicts; the
--    dead 'interludeVideo' slot (interlude scene removed) is dropped.
UPDATE public.cms_settings
SET asset_config = jsonb_set(
      asset_config,
      '{drops}',
      ((asset_config->'drops') - 'the-oath-2')
        || jsonb_build_object(
             'the-oath',
             ((asset_config->'drops'->'the-oath-2') - 'interludeVideo')
               || COALESCE(asset_config->'drops'->'the-oath', '{}'::jsonb)
           )
    )
WHERE asset_config->'drops' ? 'the-oath-2';

UPDATE public.storefront_publication
SET asset_config = jsonb_set(
      asset_config,
      '{drops}',
      ((asset_config->'drops') - 'the-oath-2')
        || jsonb_build_object(
             'the-oath',
             ((asset_config->'drops'->'the-oath-2') - 'interludeVideo')
               || COALESCE(asset_config->'drops'->'the-oath', '{}'::jsonb)
           )
    )
WHERE asset_config->'drops' ? 'the-oath-2';

-- 2) Move any 'the-oath-2' landing_content into 'the-oath' (currently empty —
--    a no-op in practice) and drop the old key.
UPDATE public.cms_settings
SET landing_content = (landing_content - 'the-oath-2')
      || jsonb_build_object(
           'the-oath',
           COALESCE(landing_content->'the-oath', landing_content->'the-oath-2')
         )
WHERE landing_content ? 'the-oath-2';

UPDATE public.storefront_publication
SET landing_content = (landing_content - 'the-oath-2')
      || jsonb_build_object(
           'the-oath',
           COALESCE(landing_content->'the-oath', landing_content->'the-oath-2')
         )
WHERE landing_content ? 'the-oath-2';

-- 3) Retire the picker row for the second page.
DELETE FROM public.landing_pages WHERE key = 'the-oath-2';

-- 4) Force the active landing page to the surviving key.
UPDATE public.cms_settings
SET active_landing_page_key = 'the-oath'
WHERE active_landing_page_key IS DISTINCT FROM 'the-oath';

UPDATE public.storefront_publication
SET active_landing_page_key = 'the-oath'
WHERE active_landing_page_key IS DISTINCT FROM 'the-oath';
