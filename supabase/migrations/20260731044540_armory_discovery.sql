-- =============================================================================
-- Armory discovery: the passport links to its owner's public armory, and
-- public armories become searchable.
--
-- CURRENT STATE
--   - `get_passport_by_token` returns owner display fields but gives a visitor
--     no path to the owner's public armory (`/armory/$handle`), even when the
--     owner has both made the piece public AND shared their armory.
--   - `storefront_profiles.armory_handle` exists but there is no anon-safe way
--     to find a public armory by name or handle — RLS (correctly) allows
--     reading only your own row.
--
-- TARGET STATE
--   - `get_passport_by_token` additionally returns `owner_armory_handle`,
--     non-null ONLY when BOTH consents are present:
--       (a) the viewer may see the owner on this piece (owner themselves, or
--           the passport is public) — a private passport must never leak the
--           owner↔garment pairing through the handle; and
--       (b) the owner's profile has `armory_public = true` with a handle.
--     Transfer-code holders deliberately do NOT unlock the handle: the code
--     proves a hand-over in progress, not a decision to publicise the armory.
--   - New RPC `search_public_armories(p_query, p_limit)` searches ONLY
--     `armory_public` profiles by name/handle and returns ONLY the two fields
--     the public armory page already shows (handle + display name). SECURITY
--     DEFINER with ILIKE wildcards escaped so callers cannot inject patterns.
--
-- RISKS
--   - Exposing handles more widely than consent: mitigated by the AND of the
--     two switches above, and by the search returning only armory_public rows.
--   - Enumeration/scraping of public armories: these profiles are already
--     world-readable via `get_public_armory(handle)`; search adds discovery of
--     handles, which is the feature. Result cap (12) + min query length (2)
--     keep bulk harvesting inconvenient. Rate limiting remains a Phase J item.
--
-- ROLLBACK
--   - Re-run the previous `get_passport_by_token` definition from
--     `20260717140000_admin_unassign_passport.sql`'s era (drop the
--     owner_armory_handle key), and:
--       DROP FUNCTION IF EXISTS public.search_public_armories(text, integer);
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_passport_by_token(p_token text, p_transfer_code text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r public.product_passports%ROWTYPE;
  v_is_owner boolean;
  v_transfer_live boolean;
  v_show_owner boolean;
  v_armory_handle text;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 OR length(p_token) > 128 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO r FROM public.product_passports WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_is_owner := r.claimed_by IS NOT NULL AND coalesce(r.claimed_by = auth.uid(), false);
  v_transfer_live := r.transfer_code IS NOT NULL
    AND r.transfer_expires_at IS NOT NULL
    AND r.transfer_expires_at > now();
  v_show_owner := v_is_owner
    OR r.is_public
    OR (p_transfer_code IS NOT NULL AND v_transfer_live AND r.transfer_code = p_transfer_code);

  -- The armory link needs BOTH consents (see header). Deliberately narrower
  -- than v_show_owner: a live transfer code shows the current owner's name,
  -- but must not advertise their armory.
  IF (v_is_owner OR r.is_public) AND r.claimed_by IS NOT NULL THEN
    SELECT sp.armory_handle INTO v_armory_handle
    FROM public.storefront_profiles sp
    WHERE sp.id = r.claimed_by
      AND sp.armory_public IS TRUE
      AND sp.armory_handle IS NOT NULL;
  END IF;

  RETURN jsonb_build_object(
    'product_slug', r.product_slug,
    'product_name', r.product_name,
    'serial_number', r.serial_number,
    'edition_total', r.edition_total,
    'is_claimed', r.claimed_by IS NOT NULL,
    'is_owner', v_is_owner,
    'is_public', r.is_public,
    'claimed_display_name', CASE WHEN v_show_owner THEN r.claimed_display_name END,
    'claimed_at', CASE WHEN v_show_owner THEN r.claimed_at END,
    'claimed_color', CASE WHEN v_is_owner THEN r.claimed_color END,
    'claimed_size', CASE WHEN v_is_owner THEN r.claimed_size END,
    'is_transfer_pending', CASE WHEN v_is_owner THEN v_transfer_live ELSE false END,
    'transfer_valid',
      p_transfer_code IS NOT NULL
      AND v_transfer_live
      AND r.transfer_code = p_transfer_code,
    'owner_armory_handle', v_armory_handle
  );
END;
$function$;

COMMENT ON FUNCTION public.get_passport_by_token(text, text) IS
  'Privacy-aware passport read by QR token. owner_armory_handle is non-null only when the passport shows its owner (owner/public) AND the owner''s armory is public.';

CREATE OR REPLACE FUNCTION public.search_public_armories(p_query text, p_limit integer DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_query text;
  v_limit integer;
  v_rows jsonb;
BEGIN
  IF p_query IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  v_query := btrim(p_query);
  IF length(v_query) < 2 OR length(v_query) > 64 THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Escape ILIKE wildcards so a caller's '%'/'_' match literally instead of
  -- turning the search into "list everything".
  v_query := replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_');
  v_limit := least(greatest(coalesce(p_limit, 8), 1), 12);

  SELECT coalesce(jsonb_agg(row_data), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT jsonb_build_object(
      'handle', sp.armory_handle,
      'display_name', coalesce(nullif(btrim(sp.full_name), ''), sp.armory_handle)
    ) AS row_data
    FROM public.storefront_profiles sp
    WHERE sp.armory_public IS TRUE
      AND sp.armory_handle IS NOT NULL
      AND (
        sp.armory_handle ILIKE '%' || v_query || '%' ESCAPE '\'
        OR sp.full_name ILIKE '%' || v_query || '%' ESCAPE '\'
      )
    ORDER BY
      -- Handle prefix hits first: searching "for" should surface @forge-…
      -- before someone whose middle name happens to contain it.
      (sp.armory_handle ILIKE v_query || '%' ESCAPE '\') DESC,
      sp.armory_handle ASC
    LIMIT v_limit
  ) matches;

  RETURN v_rows;
END;
$function$;

COMMENT ON FUNCTION public.search_public_armories(text, integer) IS
  'Anon-safe search over PUBLIC armories only (armory_public = true). Returns handle + display name — exactly the fields /armory/$handle already shows. Wildcards escaped; results capped at 12.';

REVOKE ALL ON FUNCTION public.search_public_armories(text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.search_public_armories(text, integer) TO anon, authenticated;
