-- Hero preset catalog: four storefront layouts + legacy alias rows for migration.

insert into public.cms_act_layouts (id, nature_id, preset_key, label, sort_order) values
  ('hero-standardHero', 'hero', 'standardHero', 'Standard hero', 0),
  ('hero-editorialHero', 'hero', 'editorialHero', 'Editorial hero', 1),
  ('hero-productHero', 'hero', 'productHero', 'Product hero', 2),
  ('hero-cinematicScrollHero', 'hero', 'cinematicScrollHero', 'Cinematic scroll hero', 3),
  ('hero-theOathCinematic', 'hero', 'theOathCinematic', 'The Oath cinematic (legacy)', 4),
  ('hero-splitProduct', 'hero', 'splitProduct', 'Split product hero (legacy)', 5),
  ('hero-minimalEmblem', 'hero', 'minimalEmblem', 'Minimal emblem hero (legacy)', 6)
on conflict (id) do update set
  nature_id = excluded.nature_id,
  preset_key = excluded.preset_key,
  label = excluded.label,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Deprecate brand-showcase homepage mode in published snapshots.
update public.storefront_publication
set site_homepage = jsonb_set(
  coalesce(site_homepage, '{}'::jsonb),
  '{mode}',
  '"custom"'::jsonb
)
where site_homepage->>'mode' = 'default';
