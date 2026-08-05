-- admin_search_profiles: CMS-side customer lookup for the story cast picker
-- (and future admin pickers). ADDITIVE.
--
-- Security model (mirrors get_passport_by_token / the other SECURITY DEFINER
-- RPCs in 20260713120000_product_passports.sql):
--   * storefront_profiles has own-row RLS only — CMS staff cannot SELECT other
--     customers' rows directly. This RPC is the narrow, audited window: it
--     requires a cms_profiles editor/admin role and projects only safe fields
--     (name, armory handle, claim count — never email addresses back out,
--     never addresses/phone/prefs).
--   * Prefix match on full_name / armory_handle / email (email is matchable
--     as an input but not returned).
--   * anon gets nothing; plain authenticated customers get an exception.
--
-- Rollback: DROP FUNCTION IF EXISTS public.admin_search_profiles(text);

CREATE OR REPLACE FUNCTION public.admin_search_profiles(p_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  armory_handle text,
  claim_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.cms_profiles AS p
    WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
  ) THEN
    RAISE EXCEPTION 'admin_search_profiles: cms editor/admin role required';
  END IF;

  IF p_query IS NULL OR length(trim(p_query)) < 1 OR length(p_query) > 120 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sp.id AS user_id,
    sp.full_name,
    sp.armory_handle,
    (
      SELECT count(*)
      FROM public.product_passports AS pp
      WHERE pp.claimed_by = sp.id
    ) AS claim_count
  FROM public.storefront_profiles AS sp
  WHERE sp.full_name ILIKE trim(p_query) || '%'
     OR sp.armory_handle ILIKE trim(p_query) || '%'
     OR sp.email ILIKE trim(p_query) || '%'
  ORDER BY sp.full_name ASC
  LIMIT 20;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_search_profiles(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_profiles(text) TO authenticated;
