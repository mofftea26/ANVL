-- Phase G: the Armory comes alive.
--   1) Wear journal      — one-tap "wore it" counter per registered piece
--   2) Feats             — owner-authored achievement log (public/private per entry)
--   3) Hall of Honor     — up to 3 featured pieces per owner
--   4) Public Armory     — opt-in read-only armory behind a non-guessable handle
--   5) Verified reviews  — PDP reviews writable only by registered owners
--
-- Same security model as the passports: no public SELECT anywhere sensitive;
-- anon reads go through SECURITY DEFINER RPCs that project only safe fields
-- (never tokens, never user ids, never emails).

-- ---------------------------------------------------------------- helpers --
create or replace function public.anvl_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------- 1+3) wear + hall of honor --
alter table public.product_passports
  add column if not exists wear_count integer not null default 0,
  add column if not exists last_worn_at timestamptz,
  add column if not exists featured_slot smallint;

alter table public.product_passports
  drop constraint if exists product_passports_featured_slot_range;
alter table public.product_passports
  add constraint product_passports_featured_slot_range
  check (featured_slot is null or featured_slot between 1 and 3);

-- One piece per shrine slot per owner.
create unique index if not exists product_passports_featured_slot_unique
  on public.product_passports (claimed_by, featured_slot)
  where featured_slot is not null;

-- Owner-only wear log. p_delta is clamped to +1/-1 (the -1 is the "oops"
-- path) and the count never goes below zero.
create or replace function public.log_passport_wear(p_id uuid, p_delta integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
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
  returning wear_count into v_count;

  if v_count is null then
    return jsonb_build_object('ok', false, 'error', 'not_owner');
  end if;
  return jsonb_build_object('ok', true, 'wear_count', v_count);
end;
$$;

-- Owner pins a piece to a Hall of Honor slot (1-3), or clears it with null.
-- Whatever previously held that slot is unpinned — last pin wins.
create or replace function public.set_passport_featured(p_id uuid, p_slot smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_updated integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if p_slot is not null and (p_slot < 1 or p_slot > 3) then
    return jsonb_build_object('ok', false, 'error', 'invalid_input');
  end if;

  if p_slot is not null then
    update public.product_passports
       set featured_slot = null, updated_at = now()
     where claimed_by = v_uid and featured_slot = p_slot and id <> p_id;
  end if;

  update public.product_passports
     set featured_slot = p_slot, updated_at = now()
   where id = p_id and claimed_by = v_uid;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', 'not_owner');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------------ 2) feats --
create table if not exists public.armory_feats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  achieved_on date not null default current_date,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint armory_feats_title_len check (char_length(title) between 1 and 160)
);

alter table public.armory_feats enable row level security;

drop trigger if exists armory_feats_touch on public.armory_feats;
create trigger armory_feats_touch
  before update on public.armory_feats
  for each row execute function public.anvl_touch_updated_at();

-- Owner-only CRUD; public exposure happens exclusively through
-- get_public_armory (no anon SELECT — user ids never leak).
drop policy if exists armory_feats_select_own on public.armory_feats;
create policy armory_feats_select_own on public.armory_feats
  for select using (coalesce(user_id = (select auth.uid()), false));

drop policy if exists armory_feats_insert_own on public.armory_feats;
create policy armory_feats_insert_own on public.armory_feats
  for insert with check (user_id = (select auth.uid()));

drop policy if exists armory_feats_update_own on public.armory_feats;
create policy armory_feats_update_own on public.armory_feats
  for update using (coalesce(user_id = (select auth.uid()), false))
  with check (user_id = (select auth.uid()));

drop policy if exists armory_feats_delete_own on public.armory_feats;
create policy armory_feats_delete_own on public.armory_feats
  for delete using (coalesce(user_id = (select auth.uid()), false));

-- --------------------------------------------------------- 4) public armory --
alter table public.storefront_profiles
  add column if not exists armory_public boolean not null default false,
  add column if not exists armory_handle text;

create unique index if not exists storefront_profiles_armory_handle_unique
  on public.storefront_profiles (armory_handle)
  where armory_handle is not null;

-- Owner toggles sharing. The handle is minted once (72 bits of entropy) and
-- survives disable/re-enable so shared links revive rather than rot.
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
         armory_handle = coalesce(armory_handle, encode(gen_random_bytes(9), 'hex')),
         updated_at = now()
   where id = v_uid
  returning armory_handle into v_handle;

  if v_handle is null then
    return jsonb_build_object('ok', false, 'error', 'no_profile');
  end if;
  return jsonb_build_object('ok', true, 'handle', v_handle, 'public', p_public);
end;
$$;

-- Anon read of an opted-in armory. Projects ONLY what the owner chose to
-- show: public pieces (never tokens/serials/emails), public feats, and the
-- aggregate counts the rank derives from. Unknown/disabled handle → null,
-- indistinguishable from nonexistent.
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
      select jsonb_build_object('title', title, 'achieved_on', achieved_on) as feat
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

-- ------------------------------------------------------ 5) verified reviews --
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null,
  rating smallint not null,
  title text,
  body text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_reviews_rating_range check (rating between 1 and 5),
  constraint product_reviews_title_len check (title is null or char_length(title) <= 120),
  constraint product_reviews_body_len check (char_length(body) between 1 and 2000),
  constraint product_reviews_name_len check (char_length(display_name) between 1 and 120),
  constraint product_reviews_one_per_product unique (user_id, product_slug)
);

alter table public.product_reviews enable row level security;

drop trigger if exists product_reviews_touch on public.product_reviews;
create trigger product_reviews_touch
  before update on public.product_reviews
  for each row execute function public.anvl_touch_updated_at();

-- Owners see/delete their own review; public reads + writes go through RPCs
-- so ownership is verified and user ids stay private.
drop policy if exists product_reviews_select_own on public.product_reviews;
create policy product_reviews_select_own on public.product_reviews
  for select using (coalesce(user_id = (select auth.uid()), false));

drop policy if exists product_reviews_delete_own on public.product_reviews;
create policy product_reviews_delete_own on public.product_reviews
  for delete using (coalesce(user_id = (select auth.uid()), false));

-- Upsert, gated on actually owning a registered passport for the product —
-- "Verified owner" is proven, not claimed.
create or replace function public.submit_product_review(
  p_slug text,
  p_rating smallint,
  p_title text,
  p_body text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if p_slug is null or char_length(p_slug) < 1 or char_length(p_slug) > 200
     or p_rating is null or p_rating < 1 or p_rating > 5
     or p_body is null or char_length(trim(p_body)) < 1 or char_length(p_body) > 2000
     or (p_title is not null and char_length(p_title) > 120)
     or p_display_name is null or char_length(trim(p_display_name)) < 1
     or char_length(p_display_name) > 120 then
    return jsonb_build_object('ok', false, 'error', 'invalid_input');
  end if;

  if not exists (
    select 1 from public.product_passports
     where claimed_by = v_uid and product_slug = p_slug
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_verified_owner');
  end if;

  insert into public.product_reviews (user_id, product_slug, rating, title, body, display_name)
  values (v_uid, p_slug, p_rating, nullif(trim(p_title), ''), trim(p_body), trim(p_display_name))
  on conflict (user_id, product_slug) do update
     set rating = excluded.rating,
         title = excluded.title,
         body = excluded.body,
         display_name = excluded.display_name,
         updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

-- Anon-safe review listing: display name + content only, never user ids.
-- is_mine lets the signed-in owner find their review to edit or delete.
create or replace function public.get_product_reviews(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_slug is null or char_length(p_slug) < 1 or char_length(p_slug) > 200 then
    return '[]'::jsonb;
  end if;
  return coalesce((
    select jsonb_agg(review order by review->>'created_at' desc)
      from (
        select jsonb_build_object(
                 'display_name', display_name,
                 'rating', rating,
                 'title', title,
                 'body', body,
                 'created_at', created_at,
                 'is_mine', coalesce(user_id = auth.uid(), false)
               ) as review
          from public.product_reviews
         where product_slug = p_slug
         limit 50
      ) r
  ), '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------------ grants --
revoke all on function public.log_passport_wear(uuid, integer) from public, anon, authenticated;
revoke all on function public.set_passport_featured(uuid, smallint) from public, anon, authenticated;
revoke all on function public.set_armory_share(boolean) from public, anon, authenticated;
revoke all on function public.get_public_armory(text) from public, anon, authenticated;
revoke all on function public.submit_product_review(text, smallint, text, text, text) from public, anon, authenticated;
revoke all on function public.get_product_reviews(text) from public, anon, authenticated;

grant execute on function public.log_passport_wear(uuid, integer) to authenticated;
grant execute on function public.set_passport_featured(uuid, smallint) to authenticated;
grant execute on function public.set_armory_share(boolean) to authenticated;
grant execute on function public.submit_product_review(text, smallint, text, text, text) to authenticated;
grant execute on function public.get_public_armory(text) to anon, authenticated;
grant execute on function public.get_product_reviews(text) to anon, authenticated;
