-- SEC-25: cms_media_public_read / story_media_public_read granted `public`
-- SELECT on storage.objects scoped only by bucket_id, which Supabase Storage's
-- API treats as permission for BOTH "fetch a known object" and "list all
-- objects in the bucket." Both buckets are marked `public: true` at the
-- bucket level, and Supabase serves public-URL object fetches
-- (/storage/v1/object/public/{bucket}/{path}) via that bucket flag directly,
-- NOT via this RLS policy -- so dropping the policy only removes the ability
-- to enumerate all filenames via the Storage list/table API, with zero
-- impact on existing public CDN URLs already in use across the storefront
-- and CMS (publicCmsMediaUrl(), story media, etc.).
--
-- Verified safe before applying: grepped every `.storage.from(...)` call in
-- the app -- only `.upload()`/`.remove()` exist, no `.list()` anywhere. The
-- admin UI's own media listing goes through the `cms_media_assets` database
-- table (RLS-gated to editor/admin separately), not the Storage API.
drop policy if exists cms_media_public_read on storage.objects;
drop policy if exists story_media_public_read on storage.objects;
