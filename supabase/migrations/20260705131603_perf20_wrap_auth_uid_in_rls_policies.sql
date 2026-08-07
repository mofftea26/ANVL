-- PERF-20: Postgres re-evaluates a bare auth.<fn>() call once per row scanned
-- under RLS; wrapping it as (select auth.<fn>()) lets the planner treat it as
-- a stable, single-evaluation subquery instead. Pure performance fix, zero
-- change in access semantics -- each policy below is dropped and recreated
-- with byte-for-byte identical logic, only the auth.uid()/auth.jwt() calls
-- are wrapped. Low urgency at current row counts (all tables <25 rows) but
-- cheap and mechanical to fix now. User-approved 2026-07-05.

-- cms_profiles
drop policy if exists cms_profiles_select_self on public.cms_profiles;
create policy cms_profiles_select_self on public.cms_profiles
for select to authenticated
using ((select auth.uid()) = user_id);

-- cms_settings
drop policy if exists cms_settings_update_editor on public.cms_settings;
create policy cms_settings_update_editor on public.cms_settings
for update to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])))
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

-- landing_pages
drop policy if exists landing_pages_select_cms on public.landing_pages;
create policy landing_pages_select_cms on public.landing_pages
for select to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['viewer'::text,'editor'::text,'admin'::text])));

drop policy if exists landing_pages_write_admin on public.landing_pages;
create policy landing_pages_write_admin on public.landing_pages
for all to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = 'admin'::text))
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = 'admin'::text));

-- orders
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
for select to authenticated
using ((customer_id = (select auth.uid())) or (lower(email) = lower(coalesce((select auth.jwt()) ->> 'email'::text, ''::text))));

-- storefront_profiles
drop policy if exists storefront_profiles_insert_self on public.storefront_profiles;
create policy storefront_profiles_insert_self on public.storefront_profiles
for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists storefront_profiles_select_self on public.storefront_profiles;
create policy storefront_profiles_select_self on public.storefront_profiles
for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists storefront_profiles_update_self on public.storefront_profiles;
create policy storefront_profiles_update_self on public.storefront_profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- storefront_publication
drop policy if exists storefront_publication_update_admin on public.storefront_publication;
create policy storefront_publication_update_admin on public.storefront_publication
for update to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = 'admin'::text))
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = 'admin'::text));

-- cms_media_assets
drop policy if exists cms_media_assets_delete_editor on public.cms_media_assets;
create policy cms_media_assets_delete_editor on public.cms_media_assets
for delete to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists cms_media_assets_insert_editor on public.cms_media_assets;
create policy cms_media_assets_insert_editor on public.cms_media_assets
for insert to authenticated
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists cms_media_assets_select_cms on public.cms_media_assets;
create policy cms_media_assets_select_cms on public.cms_media_assets
for select to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['viewer'::text,'editor'::text,'admin'::text])));

drop policy if exists cms_media_assets_update_editor on public.cms_media_assets;
create policy cms_media_assets_update_editor on public.cms_media_assets
for update to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])))
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

-- story_chapters
drop policy if exists story_chapters_delete_editor on public.story_chapters;
create policy story_chapters_delete_editor on public.story_chapters
for delete to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists story_chapters_insert_editor on public.story_chapters;
create policy story_chapters_insert_editor on public.story_chapters
for insert to authenticated
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists story_chapters_select_cms on public.story_chapters;
create policy story_chapters_select_cms on public.story_chapters
for select to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['viewer'::text,'editor'::text,'admin'::text])));

drop policy if exists story_chapters_update_editor on public.story_chapters;
create policy story_chapters_update_editor on public.story_chapters
for update to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])))
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

-- story_acts
drop policy if exists story_acts_delete_editor on public.story_acts;
create policy story_acts_delete_editor on public.story_acts
for delete to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists story_acts_insert_editor on public.story_acts;
create policy story_acts_insert_editor on public.story_acts
for insert to authenticated
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists story_acts_select_cms on public.story_acts;
create policy story_acts_select_cms on public.story_acts
for select to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['viewer'::text,'editor'::text,'admin'::text])));

drop policy if exists story_acts_update_editor on public.story_acts;
create policy story_acts_update_editor on public.story_acts
for update to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])))
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

-- story_cast
drop policy if exists story_cast_delete_editor on public.story_cast;
create policy story_cast_delete_editor on public.story_cast
for delete to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists story_cast_insert_editor on public.story_cast;
create policy story_cast_insert_editor on public.story_cast
for insert to authenticated
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));

drop policy if exists story_cast_select_cms on public.story_cast;
create policy story_cast_select_cms on public.story_cast
for select to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['viewer'::text,'editor'::text,'admin'::text])));

drop policy if exists story_cast_update_editor on public.story_cast;
create policy story_cast_update_editor on public.story_cast
for update to authenticated
using (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])))
with check (exists (select 1 from cms_profiles p where p.user_id = (select auth.uid()) and p.role = any (array['editor'::text,'admin'::text])));
