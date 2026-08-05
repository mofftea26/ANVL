-- Fix: set_armory_share failed at runtime — gen_random_bytes lives in the
-- `extensions` schema, invisible under `set search_path = public`, so the
-- share toggle silently did nothing. Mint the handle with the built-in
-- gen_random_uuid() instead (32 hex chars, 122 bits of entropy).
create or replace function public.set_armory_share(p_public boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_handle text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  update public.storefront_profiles
     set armory_public = p_public,
         armory_handle = coalesce(armory_handle, replace(gen_random_uuid()::text, '-', '')),
         updated_at = now()
   where id = v_uid
  returning armory_handle into v_handle;

  if v_handle is null then
    return jsonb_build_object('ok', false, 'error', 'no_profile');
  end if;
  return jsonb_build_object('ok', true, 'handle', v_handle, 'public', p_public);
end;
$$;

revoke all on function public.set_armory_share(boolean) from public, anon, authenticated;
grant execute on function public.set_armory_share(boolean) to authenticated;
