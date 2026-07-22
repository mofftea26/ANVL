-- Allow MANY story chapters ("books") per product. NON-DESTRUCTIVE (index swap).
--
-- Rationale: 20260630140000_story_product_link.sql created a partial UNIQUE
-- index (story_chapters_product_slug_key) enforcing one book per product_slug.
-- The Story shelf now supports several books telling one product's saga, so
-- the uniqueness constraint goes away. Readers that embed a product's book
-- (PDP `/shop/$slug`, passport `/p/$token`) use ordered-first semantics — the
-- chapter with the lowest sort_order wins (see StoryClient.getChapterByProductSlug).
-- The base `slug` UNIQUE constraint on story_chapters is untouched.
--
-- A plain (non-unique) partial index replaces it so product_slug lookups stay
-- indexed.
--
-- Rollback: re-deduplicate (keep the lowest sort_order row per product_slug),
-- then:
--   DROP INDEX IF EXISTS public.story_chapters_product_slug_idx;
--   CREATE UNIQUE INDEX story_chapters_product_slug_key
--     ON public.story_chapters (product_slug) WHERE product_slug IS NOT NULL;

DROP INDEX IF EXISTS public.story_chapters_product_slug_key;

CREATE INDEX IF NOT EXISTS story_chapters_product_slug_idx
  ON public.story_chapters (product_slug)
  WHERE product_slug IS NOT NULL;
