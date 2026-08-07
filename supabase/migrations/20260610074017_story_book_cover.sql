-- Story chapters gain a cover logo (drop logo stamped on the 3D book cover) and
-- a per-book colour theme (cloth cover / foil / gilded page edges).
alter table public.story_chapters
  add column if not exists cover_logo jsonb not null default '{}'::jsonb,
  add column if not exists cover_colors jsonb not null default '{}'::jsonb;
