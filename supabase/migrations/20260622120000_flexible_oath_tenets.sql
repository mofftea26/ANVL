-- Flexible Oath tenets: tenet images move from fixed asset slots (chapterMedia1-4)
-- into landing_content['the-oath'].tenets.items[].mediaId. Strip the deprecated
-- keys from asset_config; client hydration performs the id merge when needed.

UPDATE public.cms_settings
SET asset_config = jsonb_set(
      asset_config,
      '{drops,the-oath}',
      (asset_config->'drops'->'the-oath')
        - 'chapterMedia1'
        - 'chapterMedia2'
        - 'chapterMedia3'
        - 'chapterMedia4'
    )
WHERE asset_config->'drops' ? 'the-oath'
  AND (
    asset_config->'drops'->'the-oath' ? 'chapterMedia1'
    OR asset_config->'drops'->'the-oath' ? 'chapterMedia2'
    OR asset_config->'drops'->'the-oath' ? 'chapterMedia3'
    OR asset_config->'drops'->'the-oath' ? 'chapterMedia4'
  );

UPDATE public.storefront_publication
SET asset_config = jsonb_set(
      asset_config,
      '{drops,the-oath}',
      (asset_config->'drops'->'the-oath')
        - 'chapterMedia1'
        - 'chapterMedia2'
        - 'chapterMedia3'
        - 'chapterMedia4'
    )
WHERE asset_config->'drops' ? 'the-oath'
  AND (
    asset_config->'drops'->'the-oath' ? 'chapterMedia1'
    OR asset_config->'drops'->'the-oath' ? 'chapterMedia2'
    OR asset_config->'drops'->'the-oath' ? 'chapterMedia3'
    OR asset_config->'drops'->'the-oath' ? 'chapterMedia4'
  );
