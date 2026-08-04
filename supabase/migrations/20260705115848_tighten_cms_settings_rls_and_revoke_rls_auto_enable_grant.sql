-- SEC-21: cms_settings is the admin DRAFT/working-copy table (unpublished
-- landing/shop/pdp content). It previously had a public SELECT policy
-- (qual: true), letting anon read unpublished CMS drafts via REST before
-- publish. Storefront code only ever reads storefront_publication (verified
-- via repo grep); no code path depends on public read of cms_settings. Lock
-- it to CMS roles only, matching the select_cms pattern used on every other
-- CMS table (cms_media_assets, landing_pages, story_chapters/acts/cast).
drop policy if exists cms_settings_select_all on public.cms_settings;

create policy cms_settings_select_cms on public.cms_settings
for select
to authenticated
using (
  exists (
    select 1 from public.cms_profiles p
    where p.user_id = (select auth.uid())
      and p.role = any (array['viewer'::text, 'editor'::text, 'admin'::text])
  )
);

-- SEC-22: rls_auto_enable() is an event-trigger helper (RETURNS event_trigger)
-- that can only run inside an event-trigger dispatch context; it cannot be
-- invoked usefully via /rest/v1/rpc/. Its EXECUTE grant to anon/authenticated
-- is unnecessary public surface area flagged by the security advisor -- revoke
-- it per least privilege. Event triggers still fire normally for the owning
-- role (postgres); this does not disable the trigger.
revoke execute on function public.rls_auto_enable() from anon, authenticated;
