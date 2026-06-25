-- Theoath Modern landing page (picker metadata only; the page itself is
-- code-owned in src/features/landingPages/pages/TheoathModern). Additive +
-- idempotent: re-running updates the metadata and never touches the-oath.
--
-- Rollback:
--   delete from public.landing_pages where key = 'theoath-modern';
insert into public.landing_pages (key, name, description, preview_image, is_available)
values (
  'theoath-modern',
  'Theoath Modern',
  'Dark technical product-laboratory experience for Drop 01 — editorial, dimensional, premium.',
  '/brand/the-oath-shape.svg',
  true
)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  preview_image = excluded.preview_image,
  is_available = excluded.is_available,
  updated_at = now();
