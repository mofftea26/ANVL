-- Audit fixes, round 2 (docs/COMPREHENSIVE_PLATFORM_REVIEW_PLAN.md).
-- Behaviour-correcting only; no table is dropped and no row is rewritten.
-- Filename version matches the applied version exactly (MIG-01 discipline).

-- 1) accept_passport_transfer never reset Armory state.
--    The function was written 2026-07-14; is_public landed 07-15 and
--    wear_count / last_worn_at / featured_slot (plus a PARTIAL UNIQUE index on
--    (claimed_by, featured_slot) WHERE featured_slot IS NOT NULL) landed 07-16.
--    It was never revisited, so a hand-over:
--      * carried the previous owner's wear_count and last_worn_at to the new one;
--      * carried featured_slot across — and if the receiving owner already had a
--        passport pinned to that slot, the unique index made the whole transfer
--        HARD-FAIL with a constraint error;
--      * carried is_public across, so the new owner's name could be published
--        on a public armory they never opted into.
--    The reset list matches admin_unassign_passport's, which got this right.
CREATE OR REPLACE FUNCTION public.accept_passport_transfer(p_token text, p_code text, p_display_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    transfer_expires_at = NULL,
    -- Armory state belongs to the PREVIOUS owner; a hand-over starts fresh.
    wear_count = 0,
    last_worn_at = NULL,
    featured_slot = NULL,
    is_public = false
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
$function$;

-- 2) log_passport_wear evaluated the 24h cooldown in plpgsql BETWEEN a SELECT
--    and a separate UPDATE, with nothing locking the row in between. Two calls
--    in the same millisecond -- a double-tap on mobile, or a deliberate replay --
--    both read the old last_worn_at, both passed the check, and both
--    incremented. Folding the cooldown into the UPDATE's WHERE clause makes the
--    row lock arbitrate it, the same pattern claim_passport already uses.
CREATE OR REPLACE FUNCTION public.log_passport_wear(p_id uuid, p_delta integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_count integer;
  v_last timestamptz;
  v_delta integer := case when p_delta < 0 then -1 else 1 end;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  update public.product_passports
     set wear_count = greatest(0, wear_count + v_delta),
         last_worn_at = case when v_delta > 0 then now() else last_worn_at end,
         updated_at = now()
   where id = p_id
     and claimed_by = v_uid
     -- One wear per 24h. The "oops" undo (v_delta < 0) bypasses the cooldown.
     and (v_delta < 0 or last_worn_at is null or last_worn_at <= now() - interval '24 hours')
  returning wear_count into v_count;

  if v_count is not null then
    return jsonb_build_object('ok', true, 'wear_count', v_count);
  end if;

  -- The UPDATE matched nothing: either the caller does not own the row, or the
  -- cooldown blocked it. Distinguish the two for the caller's message.
  select wear_count, last_worn_at into v_count, v_last
    from public.product_passports
   where id = p_id and claimed_by = v_uid;

  if v_count is null then
    return jsonb_build_object('ok', false, 'error', 'not_owner');
  end if;

  return jsonb_build_object(
    'ok', false,
    'error', 'cooldown',
    'wear_count', v_count,
    'next_at', to_char(v_last + interval '24 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
end;
$function$;

-- 3) orders RLS coerced BOTH sides of the email comparison to '' when absent,
--    so an order row whose email failed to resolve (the Shopify webhook's ??
--    chain passes '' through, since '' is not null) became readable by ANY
--    signed-in user whose token carries no email claim. NULL never equals NULL,
--    so nullif() makes the empty case unmatchable. Also adopts the
--    (select auth.<fn>()) form this table's policy had drifted away from.
DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders
FOR SELECT TO authenticated
USING (
  customer_id = (select auth.uid())
  OR lower(nullif(email, '')) = lower(nullif((select auth.jwt()) ->> 'email', ''))
);
