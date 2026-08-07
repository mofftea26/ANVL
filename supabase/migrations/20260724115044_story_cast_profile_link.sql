-- Story cast → real-athlete link. ADDITIVE.
--
-- Current state: story_cast rows carry a free-text name/rank/blurb and an
-- act_id ("appears in"). The rework makes a cast member a snapshot of a real
-- customer: the picked athlete's derived rank, their profile avatar, and their
-- shareable armory handle (for the clickable /armory/$handle mention link).
--
-- Target state: two new nullable columns snapshot the profile link at pick
-- time. `blurb` and `act_id` stay (legacy-tolerant — old rows still parse; the
-- editor simply stops writing them). No column is dropped, RLS is unchanged.
--
--   story_cast.profile_user_id  uuid  null  -- linked storefront_profiles.id
--   story_cast.armory_handle    text  null  -- minted handle IFF armory_public
--
-- admin_search_profiles gains avatar_url + armory_public in its projection so
-- the cast picker can snapshot the avatar and decide whether the mention links
-- (only public, minted-handle athletes get a live guest-armory link).
--
-- Rollback:
--   ALTER TABLE public.story_cast DROP COLUMN IF EXISTS profile_user_id;
--   ALTER TABLE public.story_cast DROP COLUMN IF EXISTS armory_handle;
--   -- restore the prior 4-column admin_search_profiles from
--   -- 20260720101000_admin_search_profiles.sql.

ALTER TABLE public.story_cast
  ADD COLUMN IF NOT EXISTS profile_user_id uuid,
  ADD COLUMN IF NOT EXISTS armory_handle text;

COMMENT ON COLUMN public.story_cast.profile_user_id IS
  'Linked storefront_profiles.id when the cast member is a real athlete (null for lore characters). Snapshot at pick time.';
COMMENT ON COLUMN public.story_cast.armory_handle IS
  'Snapshot of the athlete''s armory_handle at pick time — set only when the armory was public, so the storefront mention links to /armory/<handle>.';

-- Return-type change → drop + recreate. Adds avatar_url + armory_public.
DROP FUNCTION IF EXISTS public.admin_search_profiles(text);

CREATE FUNCTION public.admin_search_profiles(p_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  armory_handle text,
  armory_public boolean,
  avatar_url text,
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
    sp.armory_public,
    sp.avatar_url,
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
