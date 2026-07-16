-- Phase G refinements:
--   1) Wear is once per 24h (anti-spam). The undo (-1) is always allowed.
--   2) Feats can be tied to a product (product_slug), e.g. "PR wearing this".

-- 1) Wear cooldown -----------------------------------------------------------
create or replace function public.log_passport_wear(p_id uuid, p_delta integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
  v_last timestamptz;
  v_delta integer := case when p_delta < 0 then -1 else 1 end;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select wear_count, last_worn_at into v_count, v_last
    from public.product_passports
   where id = p_id and claimed_by = v_uid;

  if v_count is null then
    return jsonb_build_object('ok', false, 'error', 'not_owner');
  end if;

  -- One wear per 24h. The "oops" undo bypasses the cooldown.
  if v_delta > 0 and v_last is not null and v_last > now() - interval '24 hours' then
    return jsonb_build_object(
      'ok', false,
      'error', 'cooldown',
      'wear_count', v_count,
      'next_at', to_char(v_last + interval '24 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
  end if;

  update public.product_passports
     set wear_count = greatest(0, wear_count + v_delta),
         last_worn_at = case when v_delta > 0 then now() else last_worn_at end,
         updated_at = now()
   where id = p_id and claimed_by = v_uid
  returning wear_count into v_count;

  return jsonb_build_object('ok', true, 'wear_count', v_count);
end;
$$;

revoke all on function public.log_passport_wear(uuid, integer) from public, anon, authenticated;
grant execute on function public.log_passport_wear(uuid, integer) to authenticated;

-- 2) Feats tied to a product -------------------------------------------------
alter table public.armory_feats
  add column if not exists product_slug text;

-- Public armory projection now carries the feat's product (if any).
create or replace function public.get_public_armory(p_handle text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_owner record;
  v_pieces jsonb;
  v_feats jsonb;
  v_total integer;
begin
  if p_handle is null or char_length(p_handle) < 8 or char_length(p_handle) > 64 then
    return null;
  end if;

  select id, coalesce(nullif(trim(full_name), ''), 'ANVL Athlete') as display_name
    into v_owner
    from public.storefront_profiles
   where armory_handle = p_handle and armory_public = true;

  if v_owner.id is null then
    return null;
  end if;

  select count(*) into v_total
    from public.product_passports
   where claimed_by = v_owner.id;

  select coalesce(jsonb_agg(piece order by piece->>'claimed_at' desc), '[]'::jsonb)
    into v_pieces
    from (
      select jsonb_build_object(
               'product_slug', product_slug,
               'product_name', product_name,
               'claimed_at', claimed_at,
               'claimed_color', claimed_color,
               'claimed_size', claimed_size,
               'wear_count', wear_count,
               'featured_slot', featured_slot
             ) as piece
        from public.product_passports
       where claimed_by = v_owner.id and is_public = true
    ) p;

  select coalesce(jsonb_agg(feat order by feat->>'achieved_on' desc), '[]'::jsonb)
    into v_feats
    from (
      select jsonb_build_object(
               'title', title,
               'achieved_on', achieved_on,
               'product_slug', product_slug
             ) as feat
        from public.armory_feats
       where user_id = v_owner.id and is_public = true
    ) f;

  return jsonb_build_object(
    'owner_name', v_owner.display_name,
    'total_pieces', v_total,
    'pieces', v_pieces,
    'feats', v_feats
  );
end;
$$;

revoke all on function public.get_public_armory(text) from public, anon, authenticated;
grant execute on function public.get_public_armory(text) to anon, authenticated;
