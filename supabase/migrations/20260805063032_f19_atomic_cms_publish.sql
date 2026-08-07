-- F-19: publish_cms_settings — the CMS publish in ONE transaction.
--
-- ADDITIVE and inert until a client calls it.
-- Rollback: DROP FUNCTION IF EXISTS public.publish_cms_settings(jsonb, jsonb);
--
-- WHY: adminCmsRemoteSync fired two independent PostgREST UPDATEs under
-- Promise.all — cms_settings (the editor's source of truth) and
-- storefront_publication (what SSR renders). postgrest-js does not reject on a
-- transport failure (it converts them to `{data:null,error}`), so Promise.all
-- NEVER rejects and never cancels its sibling: a one-of-two failure always
-- completes as a half-write. The result is self-concealing, because hydration
-- reads cms_settings ONLY — reloading /admin can never reveal the split, and if
-- cms_settings was the failed half, reloading silently replaces the operator's
-- edit with the stale draft while the storefront keeps serving the new value.
--
-- SECURITY: SECURITY DEFINER bypasses RLS, so the gate is re-implemented here as
-- the STRICTER of the two tables:
--   cms_settings           UPDATE -> cms_settings_update_editor        (editor|admin)
--   storefront_publication UPDATE -> storefront_publication_update_admin (admin)
-- Gating on 'editor' would hand editors a write path to the anon-readable
-- publication mirror that they do not have today. 'admin' widens NOTHING: the
-- table policies are untouched, so an editor keeps exactly the rights they
-- already had, and every human who reaches /admin is already role='admin'
-- (adminAuth.ts signs out anyone else).
CREATE OR REPLACE FUNCTION public.publish_cms_settings(
  p_patch jsonb,
  p_media_index jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- Mirrors CMS_SETTINGS_FIELD_KEYS in adminCmsRemoteSync.ts. There is no
  -- typecheck link between the two, so a new column must be added in BOTH.
  v_allowed constant text[] := ARRAY[
    'active_landing_page_key','theme_config','font_config','asset_config',
    'landing_content','shop_config','pdp_content','passport_content',
    'coming_soon','banner_config','legal_content','support_content','site_seo'
  ];
  v_key text;
  v_now timestamptz := clock_timestamp();
  v_settings_rows integer;
  v_pub_rows integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.cms_profiles p
    WHERE p.user_id = (select auth.uid()) AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'cms admin role required';
  END IF;

  IF p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object' THEN
    RAISE EXCEPTION 'p_patch must be a json object';
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF NOT (v_key = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'unknown column: %', v_key;
    END IF;
  END LOOP;

  -- Key PRESENCE decides whether a column is written, and a JSON `null` value is
  -- treated as absent. Every jsonb column here is NOT NULL, but a JSON null is a
  -- legal jsonb value, so the constraint would NOT catch it — it would store a
  -- json null that the Zod readers then resolve to code defaults, i.e. a silent
  -- content wipe. `coalesce(p_patch->'k', k)` has exactly that bug; this does not.
  UPDATE public.cms_settings SET
    active_landing_page_key = CASE
      WHEN p_patch ? 'active_landing_page_key'
       AND jsonb_typeof(p_patch->'active_landing_page_key') = 'string'
      THEN p_patch->>'active_landing_page_key' ELSE active_landing_page_key END,
    theme_config = CASE WHEN p_patch ? 'theme_config' AND jsonb_typeof(p_patch->'theme_config') <> 'null'
      THEN p_patch->'theme_config' ELSE theme_config END,
    font_config = CASE WHEN p_patch ? 'font_config' AND jsonb_typeof(p_patch->'font_config') <> 'null'
      THEN p_patch->'font_config' ELSE font_config END,
    asset_config = CASE WHEN p_patch ? 'asset_config' AND jsonb_typeof(p_patch->'asset_config') <> 'null'
      THEN p_patch->'asset_config' ELSE asset_config END,
    landing_content = CASE WHEN p_patch ? 'landing_content' AND jsonb_typeof(p_patch->'landing_content') <> 'null'
      THEN p_patch->'landing_content' ELSE landing_content END,
    shop_config = CASE WHEN p_patch ? 'shop_config' AND jsonb_typeof(p_patch->'shop_config') <> 'null'
      THEN p_patch->'shop_config' ELSE shop_config END,
    pdp_content = CASE WHEN p_patch ? 'pdp_content' AND jsonb_typeof(p_patch->'pdp_content') <> 'null'
      THEN p_patch->'pdp_content' ELSE pdp_content END,
    passport_content = CASE WHEN p_patch ? 'passport_content' AND jsonb_typeof(p_patch->'passport_content') <> 'null'
      THEN p_patch->'passport_content' ELSE passport_content END,
    coming_soon = CASE WHEN p_patch ? 'coming_soon' AND jsonb_typeof(p_patch->'coming_soon') <> 'null'
      THEN p_patch->'coming_soon' ELSE coming_soon END,
    banner_config = CASE WHEN p_patch ? 'banner_config' AND jsonb_typeof(p_patch->'banner_config') <> 'null'
      THEN p_patch->'banner_config' ELSE banner_config END,
    legal_content = CASE WHEN p_patch ? 'legal_content' AND jsonb_typeof(p_patch->'legal_content') <> 'null'
      THEN p_patch->'legal_content' ELSE legal_content END,
    support_content = CASE WHEN p_patch ? 'support_content' AND jsonb_typeof(p_patch->'support_content') <> 'null'
      THEN p_patch->'support_content' ELSE support_content END,
    site_seo = CASE WHEN p_patch ? 'site_seo' AND jsonb_typeof(p_patch->'site_seo') <> 'null'
      THEN p_patch->'site_seo' ELSE site_seo END,
    updated_at = v_now
  WHERE id = 1;
  GET DIAGNOSTICS v_settings_rows = ROW_COUNT;

  UPDATE public.storefront_publication SET
    active_landing_page_key = CASE
      WHEN p_patch ? 'active_landing_page_key'
       AND jsonb_typeof(p_patch->'active_landing_page_key') = 'string'
      THEN p_patch->>'active_landing_page_key' ELSE active_landing_page_key END,
    theme_config = CASE WHEN p_patch ? 'theme_config' AND jsonb_typeof(p_patch->'theme_config') <> 'null'
      THEN p_patch->'theme_config' ELSE theme_config END,
    font_config = CASE WHEN p_patch ? 'font_config' AND jsonb_typeof(p_patch->'font_config') <> 'null'
      THEN p_patch->'font_config' ELSE font_config END,
    asset_config = CASE WHEN p_patch ? 'asset_config' AND jsonb_typeof(p_patch->'asset_config') <> 'null'
      THEN p_patch->'asset_config' ELSE asset_config END,
    landing_content = CASE WHEN p_patch ? 'landing_content' AND jsonb_typeof(p_patch->'landing_content') <> 'null'
      THEN p_patch->'landing_content' ELSE landing_content END,
    shop_config = CASE WHEN p_patch ? 'shop_config' AND jsonb_typeof(p_patch->'shop_config') <> 'null'
      THEN p_patch->'shop_config' ELSE shop_config END,
    pdp_content = CASE WHEN p_patch ? 'pdp_content' AND jsonb_typeof(p_patch->'pdp_content') <> 'null'
      THEN p_patch->'pdp_content' ELSE pdp_content END,
    passport_content = CASE WHEN p_patch ? 'passport_content' AND jsonb_typeof(p_patch->'passport_content') <> 'null'
      THEN p_patch->'passport_content' ELSE passport_content END,
    coming_soon = CASE WHEN p_patch ? 'coming_soon' AND jsonb_typeof(p_patch->'coming_soon') <> 'null'
      THEN p_patch->'coming_soon' ELSE coming_soon END,
    banner_config = CASE WHEN p_patch ? 'banner_config' AND jsonb_typeof(p_patch->'banner_config') <> 'null'
      THEN p_patch->'banner_config' ELSE banner_config END,
    legal_content = CASE WHEN p_patch ? 'legal_content' AND jsonb_typeof(p_patch->'legal_content') <> 'null'
      THEN p_patch->'legal_content' ELSE legal_content END,
    support_content = CASE WHEN p_patch ? 'support_content' AND jsonb_typeof(p_patch->'support_content') <> 'null'
      THEN p_patch->'support_content' ELSE support_content END,
    site_seo = CASE WHEN p_patch ? 'site_seo' AND jsonb_typeof(p_patch->'site_seo') <> 'null'
      THEN p_patch->'site_seo' ELSE site_seo END,
    -- media_index is publication-only, and is OMITTED rather than wiped when the
    -- caller could not rebuild it (the "omit, never wipe" rule this file already
    -- applies client-side).
    media_index = CASE
      WHEN p_media_index IS NOT NULL AND jsonb_typeof(p_media_index) <> 'null'
      THEN p_media_index ELSE media_index END,
    published_at = v_now,
    -- Server clock, replacing the browser's Date.now(). `revision` is read in
    -- exactly one place and only coerced to a number; nothing orders on it.
    revision = (extract(epoch from v_now) * 1000)::bigint
  WHERE id = 1;
  GET DIAGNOSTICS v_pub_rows = ROW_COUNT;

  -- A missing singleton row must ABORT, not report a cheerful zero. Raising
  -- rolls back both UPDATEs together, which is the entire point of this function.
  IF v_settings_rows = 0 OR v_pub_rows = 0 THEN
    RAISE EXCEPTION 'publish matched no row (cms_settings=%, storefront_publication=%)',
      v_settings_rows, v_pub_rows;
  END IF;

  RETURN jsonb_build_object('settings_rows', v_settings_rows, 'publication_rows', v_pub_rows);
END
$fn$;

REVOKE EXECUTE ON FUNCTION public.publish_cms_settings(jsonb, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.publish_cms_settings(jsonb, jsonb) TO authenticated;
