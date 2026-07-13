-- Product passports: one row per physical garment unit. Each unit ships with a
-- QR card encoding /p/<token>; the first authenticated customer to claim it
-- owns it forever (atomic claim via SECURITY DEFINER RPC). ADDITIVE.
--
-- Security model:
--   * NO public SELECT policy — a blanket anon read would let anyone enumerate
--     claim tokens via PostgREST. Public/owner reads go through the
--     get_passport_by_token() RPC which projects only safe fields.
--   * Owners read their own claimed rows (Armory inventory).
--   * CMS editors/admins manage rows (generate / unassign / delete).
-- Applied 2026-07-13 via Supabase MCP.

CREATE TABLE IF NOT EXISTS public.product_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  batch_id uuid NOT NULL,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  serial_number int NOT NULL,
  edition_total int NOT NULL,
  claimed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  claimed_at timestamptz,
  claimed_color text,
  claimed_size text,
  claimed_email text,
  claimed_display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_slug, serial_number)
);

COMMENT ON TABLE public.product_passports IS
  'Per-unit product passports (QR claim tokens). No public SELECT — reads go through get_passport_by_token(); owners read their claimed rows; CMS editors/admins write.';

CREATE INDEX IF NOT EXISTS product_passports_product_slug_idx
  ON public.product_passports (product_slug);
CREATE INDEX IF NOT EXISTS product_passports_claimed_by_idx
  ON public.product_passports (claimed_by);
CREATE INDEX IF NOT EXISTS product_passports_batch_id_idx
  ON public.product_passports (batch_id);

CREATE TRIGGER product_passports_touch_updated_at
  BEFORE UPDATE ON public.product_passports
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

ALTER TABLE public.product_passports ENABLE ROW LEVEL SECURITY;

-- Owners see the passports they claimed (account Armory).
DROP POLICY IF EXISTS product_passports_select_own ON public.product_passports;
CREATE POLICY product_passports_select_own
  ON public.product_passports
  FOR SELECT
  TO authenticated
  USING (claimed_by = auth.uid());

-- CMS roles read everything (admin ledger).
DROP POLICY IF EXISTS product_passports_select_cms ON public.product_passports;
CREATE POLICY product_passports_select_cms
  ON public.product_passports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

-- Editors/admins generate batches.
DROP POLICY IF EXISTS product_passports_insert_editor ON public.product_passports;
CREATE POLICY product_passports_insert_editor
  ON public.product_passports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- Editors/admins unassign (reset claim fields).
DROP POLICY IF EXISTS product_passports_update_editor ON public.product_passports;
CREATE POLICY product_passports_update_editor
  ON public.product_passports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- Editors/admins delete passports.
DROP POLICY IF EXISTS product_passports_delete_editor ON public.product_passports;
CREATE POLICY product_passports_delete_editor
  ON public.product_passports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_passports TO authenticated;

-- ---------------------------------------------------------------------------
-- get_passport_by_token: safe public projection for the /p/<token> page.
-- Anyone holding the token may look it up (the token IS the capability).
-- Owner-only fields (color/size) are included only for the claiming user.
-- Returns NULL when the token does not exist.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_passport_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.product_passports%ROWTYPE;
  v_is_owner boolean;
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
    'claimed_size', CASE WHEN v_is_owner THEN r.claimed_size END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_passport_by_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_passport_by_token(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- claim_passport: atomic first-claim. The WHERE ... claimed_by IS NULL guard
-- guarantees exactly one owner even under concurrent scans. Returns
-- { ok: true, passport: {...} } or { ok: false, error: 'not_found' |
-- 'already_claimed' | 'not_authenticated' | 'invalid_input' }.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_passport(
  p_token text,
  p_color text,
  p_size text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.product_passports%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_token IS NULL OR length(p_token) < 8 OR length(p_token) > 128
    OR p_color IS NULL OR length(p_color) NOT BETWEEN 1 AND 80
    OR p_size IS NULL OR length(p_size) NOT BETWEEN 1 AND 40
    OR p_display_name IS NULL OR length(p_display_name) NOT BETWEEN 1 AND 120
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  UPDATE public.product_passports
  SET
    claimed_by = auth.uid(),
    claimed_at = now(),
    claimed_color = p_color,
    claimed_size = p_size,
    claimed_display_name = p_display_name,
    claimed_email = nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '')
  WHERE token = p_token
    AND claimed_by IS NULL
  RETURNING * INTO r;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.product_passports WHERE token = p_token) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.claim_passport(text, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_passport(text, text, text, text) TO authenticated;
