-- Passport visibility: the owner decides whether their registered piece is
-- publicly verifiable with their engraved name, or anonymous. Private by
-- default (spec: never expose owner information without consent). ADDITIVE.
--
-- get_passport_by_token branches for claimed pieces viewed by non-owners:
--   * is_public = true  → authenticity view (engraved name + registration date)
--   * is_public = false → anonymous "already registered" (no name, no date)
-- The owner always receives the full projection + is_public so the passport
-- page can render the visibility switch.
-- Applied 2026-07-15 via Supabase MCP.

ALTER TABLE public.product_passports
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- set_passport_visibility: owner-only toggle.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_passport_visibility(
  p_token text,
  p_public boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  UPDATE public.product_passports
  SET is_public = coalesce(p_public, false)
  WHERE token = p_token AND claimed_by = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  RETURN jsonb_build_object('ok', true, 'is_public', coalesce(p_public, false));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_passport_visibility(text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_passport_visibility(text, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- get_passport_by_token: privacy-aware projection.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_passport_by_token(
  p_token text,
  p_transfer_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.product_passports%ROWTYPE;
  v_is_owner boolean;
  v_transfer_live boolean;
  v_show_owner boolean;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 OR length(p_token) > 128 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO r FROM public.product_passports WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- coalesce: `claimed_by = NULL` yields NULL (not false) for anon callers.
  v_is_owner := r.claimed_by IS NOT NULL AND coalesce(r.claimed_by = auth.uid(), false);
  v_transfer_live := r.transfer_code IS NOT NULL
    AND r.transfer_expires_at IS NOT NULL
    AND r.transfer_expires_at > now();
  -- Owner name/date are shown to non-owners only when the owner opted in —
  -- EXCEPT to a valid transfer-link holder (they were invited by the owner).
  v_show_owner := v_is_owner
    OR r.is_public
    OR (p_transfer_code IS NOT NULL AND v_transfer_live AND r.transfer_code = p_transfer_code);

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
      AND r.transfer_code = p_transfer_code
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_passport_by_token(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_passport_by_token(text, text) TO anon, authenticated;
