-- Act nature + layout catalog for CMS editors and storefront renderers.
-- Seeded from the in-repo act preset registry; editable without redeploy.

create table if not exists public.cms_act_natures (
  id text primary key,
  label text not null,
  description text not null default '',
  content_schema jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_act_layouts (
  id text primary key,
  nature_id text not null references public.cms_act_natures(id) on delete cascade,
  preset_key text not null,
  label text not null,
  description text not null default '',
  default_content jsonb not null default '{}'::jsonb,
  animation_hints jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nature_id, preset_key)
);

alter table public.cms_act_natures enable row level security;
alter table public.cms_act_layouts enable row level security;

create policy "Public read act natures"
  on public.cms_act_natures for select
  using (true);

create policy "Public read act layouts"
  on public.cms_act_layouts for select
  using (true);

create policy "Admin write act natures"
  on public.cms_act_natures for all
  to authenticated
  using (
    exists (
      select 1 from public.cms_profiles as p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.cms_profiles as p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin write act layouts"
  on public.cms_act_layouts for all
  to authenticated
  using (
    exists (
      select 1 from public.cms_profiles as p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.cms_profiles as p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- Seed natures (content_schema mirrors landingActs.zod keys)
insert into public.cms_act_natures (id, label, description, content_schema, sort_order) values
  ('hero', 'Hero', 'Opening cinematic with CTAs and optional countdown.', '{"fields":["countdownTargetIso","backgroundImageUrl","emblemWatermarkSrc","primaryCta","secondaryCta"]}', 0),
  ('manifesto', 'Manifesto', 'Editorial oath with quote, story, and tenet bullets.', '{"fields":["quote","storyParagraphs","tenets"]}', 1),
  ('storytelling', 'Storytelling', 'Chapter-based narrative scroll.', '{"fields":["chapterTitle","chapterBody"]}', 2),
  ('dropReveal', 'Drop reveal', 'Monolith reveal with release timing and CTAs.', '{"fields":["releaseDateIso","dropVisualSrc","primaryCta","secondaryCta"]}', 3),
  ('productShowcase', 'Product showcase', 'Featured SKUs with card layout variants.', '{"fields":["cardStyle","viewAllLabel","viewAllHref"]}', 4),
  ('materialShowcase', 'Material showcase', 'Fabric and construction specs.', '{"fields":["materialName","gsm","composition","fitNotes","constructionNotes"]}', 5),
  ('specialEvent', 'Special event', 'Timed event card with location and rules.', '{"fields":["eventTitle","startsAtIso","endsAtIso","location","linkHref","rules","cta"]}', 6),
  ('lookbook', 'Lookbook', 'Gallery grid, carousel, or editorial layout.', '{"fields":["layout","galleryItems"]}', 7),
  ('newsletterWaitlist', 'Newsletter / waitlist', 'Email capture with consent copy.', '{"fields":["formIntro","consentCopy","preferredProductOptions"]}', 8),
  ('finalCTA', 'Final CTA', 'Closing call-to-action block.', '{"fields":["backgroundImageUrl","primaryCta","secondaryCta","tertiaryCta"]}', 9)
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  content_schema = excluded.content_schema,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Seed layouts (preset_key matches act-presets registry)
insert into public.cms_act_layouts (id, nature_id, preset_key, label, sort_order) values
  ('hero-theOathCinematic', 'hero', 'theOathCinematic', 'The Oath cinematic', 0),
  ('hero-splitProduct', 'hero', 'splitProduct', 'Split product hero', 1),
  ('hero-minimalEmblem', 'hero', 'minimalEmblem', 'Minimal emblem hero', 2),
  ('manifesto-oathStampLedger', 'manifesto', 'oathStampLedger', 'Oath stamp ledger', 0),
  ('manifesto-splitText', 'manifesto', 'splitText', 'Split text manifesto', 1),
  ('manifesto-scrollStacked', 'manifesto', 'scrollStacked', 'Scroll stacked', 2),
  ('storytelling-chapterScroll', 'storytelling', 'chapterScroll', 'Chapter scroll', 0),
  ('storytelling-editorialArticle', 'storytelling', 'editorialArticle', 'Editorial article', 1),
  ('storytelling-imageLed', 'storytelling', 'imageLed', 'Image led', 2),
  ('dropReveal-monolithReveal', 'dropReveal', 'monolithReveal', 'Monolith reveal', 0),
  ('dropReveal-countdownTrio', 'dropReveal', 'countdownTrio', 'Countdown trio', 1),
  ('dropReveal-emblemFirst', 'dropReveal', 'emblemFirst', 'Emblem first', 2),
  ('productShowcase-threeCardEditorial', 'productShowcase', 'threeCardEditorial', 'Three card editorial', 0),
  ('productShowcase-carousel', 'productShowcase', 'carousel', 'Carousel', 1),
  ('productShowcase-productStory', 'productShowcase', 'productStory', 'Product story', 2),
  ('materialShowcase-fabricRunway', 'materialShowcase', 'fabricRunway', 'Fabric runway', 0),
  ('materialShowcase-specsGrid', 'materialShowcase', 'specsGrid', 'Specs grid', 1),
  ('materialShowcase-splitDetail', 'materialShowcase', 'splitDetail', 'Split detail', 2),
  ('specialEvent-eventCard', 'specialEvent', 'eventCard', 'Event card', 0),
  ('specialEvent-countdownEvent', 'specialEvent', 'countdownEvent', 'Countdown event', 1),
  ('specialEvent-locationSplit', 'specialEvent', 'locationSplit', 'Location split', 2),
  ('lookbook-masonry', 'lookbook', 'masonry', 'Masonry', 0),
  ('lookbook-carousel', 'lookbook', 'carousel', 'Carousel', 1),
  ('lookbook-editorial', 'lookbook', 'editorial', 'Editorial', 2),
  ('newsletterWaitlist-oathFullWidthForm', 'newsletterWaitlist', 'oathFullWidthForm', 'Oath full width form', 0),
  ('newsletterWaitlist-minimalForm', 'newsletterWaitlist', 'minimalForm', 'Minimal form', 1),
  ('newsletterWaitlist-splitForm', 'newsletterWaitlist', 'splitForm', 'Split form', 2),
  ('finalCTA-centered', 'finalCTA', 'centered', 'Centered', 0),
  ('finalCTA-footerOverlap', 'finalCTA', 'footerOverlap', 'Footer overlap', 1),
  ('finalCTA-productCta', 'finalCTA', 'productCta', 'Product CTA', 2)
on conflict (id) do update set
  nature_id = excluded.nature_id,
  preset_key = excluded.preset_key,
  label = excluded.label,
  sort_order = excluded.sort_order,
  updated_at = now();
