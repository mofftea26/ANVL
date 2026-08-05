-- Link story chapters ("books") to products and group them by drop. ADDITIVE.
--
-- The Story page becomes a per-product bookshelf grouped by drop: each product
-- gets its own book (chapter) via `product_slug` (= Shopify handle), grouped
-- under `drop_label`/`drop_slug`. Existing chapters keep working (null product).
-- Applied 2026-06-30 via Supabase MCP.

ALTER TABLE public.story_chapters
  ADD COLUMN IF NOT EXISTS product_slug text,
  ADD COLUMN IF NOT EXISTS drop_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS drop_slug text NOT NULL DEFAULT '';

-- One book per product (nulls allowed for non-product chapters).
CREATE UNIQUE INDEX IF NOT EXISTS story_chapters_product_slug_key
  ON public.story_chapters (product_slug)
  WHERE product_slug IS NOT NULL;
