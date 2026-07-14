-- Passport ownership transfer (link + accept). The owner mints a one-time
-- transfer code (7-day expiry) baked into a share link; the recipient signs in
-- and accepts, which atomically re-forges the passport to their name and logs
-- the hand-over. ADDITIVE.
--
-- Security model mirrors the claim flow: no public reads; the code is a
-- capability carried in the link; all writes go through SECURITY DEFINER RPCs.
-- Applied 2026-07-14 via Supabase MCP.

ALTER TABLE public.product_passports
  ADD COLUMN IF NOT EXISTS transfer_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS transfer_expires_at timestamptz;

-- Transfer history (written only by the accept RPC / service role).
CREATE TABLE IF NOT EXISTS public.passport_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id uuid NOT NULL REFERENCES public.product_passports (id) ON DELETE CASCADE,
  from_user uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  to_user uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  from_display_name text,
  to_display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.passport_transfers IS
  'Passport ownership hand-over log. Written by accept_passport_transfer (SECURITY DEFINER); participants read their own rows, CMS roles read all.';

CREATE INDEX IF NOT EXISTS passport_transfers_passport_idx
  ON public.passport_transfers (passport_id, created_at DESC);

ALTER TABLE public.passport_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS passport_transfers_select_own ON public.passport_transfers;
CREATE POLICY passport_transfers_select_own
  ON public.passport_transfers
  FOR SELECT
  TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

DROP POLICY IF EXISTS passport_transfers_select_cms ON public.passport_transfers;
CREATE POLICY passport_transfers_select_cms
  ON public.passport_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

GRANT SELECT ON public.passport_transfers TO authenticated;

-- ---------------------------------------------------------------------------
-- initiate_passport_transfer: current owner mints a one-time code (7 days).
-- Re-initiating replaces the previous code.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initiate_passport_transfer(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_expires timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  v_code := gen_random_uuid()::text;
  v_expires := now() + interval '7 days';

  UPDATE public.product_passports
  SET transfer_code = v_code, transfer_expires_at = v_expires
  WHERE token = p_token AND claimed_by = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  RETURN jsonb_build_object('ok', true, 'code', v_code, 'expires_at', v_expires);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.initiate_passport_transfer(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.initiate_passport_transfer(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- cancel_passport_transfer: owner voids the pending code.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_passport_transfer(p_token text)
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
  SET transfer_code = NULL, transfer_expires_at = NULL
  WHERE token = p_token AND claimed_by = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_passport_transfer(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_passport_transfer(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- accept_passport_transfer: the recipient (signed in, holding the code)
-- atomically becomes the owner. Colorway/size stay — the garment itself
-- doesn't change hands sizes. Logs the hand-over.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_passport_transfer(
  p_token text,
  p_code text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.product_passports%ROWTYPE;
  v_from_user uuid;
  v_from_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_token IS NULL OR p_code IS NULL
    OR p_display_name IS NULL OR length(p_display_name) NOT BETWEEN 1 AND 120
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  SELECT claimed_by, claimed_display_name INTO v_from_user, v_from_name
  FROM public.product_passports
  WHERE token = p_token;

  UPDATE public.product_passports
  SET
    claimed_by = auth.uid(),
    claimed_at = now(),
    claimed_display_name = p_display_name,
    claimed_email = nullif(lower(coalesce(auth.jwt() ->> 'email', '')), ''),
    transfer_code = NULL,
    transfer_expires_at = NULL
  WHERE token = p_token
    AND transfer_code = p_code
    AND transfer_expires_at > now()
    AND claimed_by IS NOT NULL
    AND claimed_by <> auth.uid()
  RETURNING * INTO r;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'transfer_invalid');
  END IF;

  INSERT INTO public.passport_transfers
    (passport_id, from_user, to_user, from_display_name, to_display_name)
  VALUES (r.id, v_from_user, auth.uid(), v_from_name, p_display_name);

  RETURN jsonb_build_object(
    'ok', true,
    'passport', jsonb_build_object(
      'product_slug', r.product_slug,
      'product_name', r.product_name,
      'serial_number', r.serial_number,
      'edition_total', r.edition_total,
      'is_claimed', true,
      'is_owner', true,
      'claimed_display_name', r.claimed_display_name,
      'claimed_at', r.claimed_at,
      'claimed_color', r.claimed_color,
      'claimed_size', r.claimed_size
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_passport_transfer(text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_passport_transfer(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- get_passport_by_token now also reports transfer state:
--   * is_transfer_pending — owner-only (drives the owner's transfer UI)
--   * transfer_valid — whether a supplied p_transfer_code is live (drives the
--     recipient's accept screen without leaking anything else)
-- Signature change (added default param) → drop the old single-arg function.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_passport_by_token(text);

CREATE FUNCTION public.get_passport_by_token(
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

  RETURN jsonb_build_object(
    'product_slug', r.product_slug,
    'product_name', r.product_name,
    'serial_number', r.serial_number,
    'edition_total', r.edition_total,
    'is_claimed', r.claimed_by IS NOT NULL,
    'is_owner', v_is_owner,
    'claimed_display_name', r.claimed_display_name,
    'claimed_at', r.claimed_at,
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
