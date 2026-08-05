-- Admin unassign as a SECURITY DEFINER RPC with an optional purge:
--   p_purge_feats = false → the QR is freed (claim + passport-bound life
--     cleared) but the ex-owner's FEATS for that product survive — if they
--     re-claim the same product later, their records reattach (feats are
--     keyed user+product, so nothing duplicates).
--   p_purge_feats = true  → additionally deletes the ex-owner's feats for
--     that product: gone as if never owned.
-- Caller must be a CMS editor/admin (checked against cms_profiles).
create or replace function public.admin_unassign_passport(
  p_id uuid,
  p_purge_feats boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_slug text;
begin
  if v_uid is null or not exists (
    select 1 from public.cms_profiles
     where user_id = v_uid and role in ('editor', 'admin')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_authorized');
  end if;

  select claimed_by, product_slug into v_owner, v_slug
    from public.product_passports where id = p_id;
  if v_slug is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  update public.product_passports
     set claimed_by = null,
         claimed_at = null,
         claimed_color = null,
         claimed_size = null,
         claimed_email = null,
         claimed_display_name = null,
         wear_count = 0,
         last_worn_at = null,
         featured_slot = null,
         is_public = false,
         transfer_code = null,
         transfer_expires_at = null,
         updated_at = now()
   where id = p_id;

  if p_purge_feats and v_owner is not null then
    delete from public.armory_feats
     where user_id = v_owner and product_slug = v_slug;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_unassign_passport(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_unassign_passport(uuid, boolean) to authenticated;
