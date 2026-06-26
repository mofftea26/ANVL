-- The Oath Modern — rename the landing_pages picker row for the rebuilt flagship.
--
-- The `theoath-modern` key is reused (the old Theoath Modern page is retired in
-- code), so this only refreshes the editor-facing display name + description to
-- match the continuous-3D ceremonial rebuild. Idempotent; no schema change, no
-- RLS change. Content/asset assignments live in cms_settings / storefront_publication.

update public.landing_pages
set
  name = 'The Oath Modern',
  description = 'Continuous-3D ceremonial flagship for Drop 01 — one evolving forged world, scroll-choreographed from threshold to vow.',
  updated_at = now()
where key = 'theoath-modern';

-- Safety net: ensure the row exists even on a fresh project.
insert into public.landing_pages (key, name, description, preview_image, is_available)
select
  'theoath-modern',
  'The Oath Modern',
  'Continuous-3D ceremonial flagship for Drop 01 — one evolving forged world, scroll-choreographed from threshold to vow.',
  '/brand/the-oath-shape.svg',
  true
where not exists (select 1 from public.landing_pages where key = 'theoath-modern');
