-- Reserved for Site Media library (PR-6). Column lands early so remote sync can patch safely.
ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS media_index jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.storefront_publication.media_index IS
  'Published media asset catalog [{id,path,alt,mime,w,h,updatedAt}] for picker + storefront OG helpers.';
