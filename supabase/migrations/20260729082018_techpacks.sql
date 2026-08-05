-- Techpack ingestion: supplier techpack PDFs parsed in the ADMIN BROWSER (pdf.js)
-- into a normalized TechpackDocument, with every extracted image kept PRIVATE
-- until an editor deliberately promotes one into the public cms-media library.
--
-- Current schema:
--   none (greenfield). Techpack PDFs live only on the operator's disk today.
--
-- Target schema:
--   public.techpacks        one row per uploaded PDF. `document` jsonb holds the
--                           parsed TechpackDocument (tagged with schema_version).
--                           At most ONE is_final row per product_slug.
--   public.techpack_images  one row per extracted image XObject. storage_path
--                           points into the PRIVATE `techpacks` bucket;
--                           promoted_media_id links to cms_media_assets once an
--                           editor publishes that image.
--   storage bucket `techpacks`  PRIVATE, 100 MB, application/pdf + image mimes.
--   public.set_techpack_final(uuid)  SECURITY DEFINER, returns jsonb {ok,error}.
--
-- Risks:
--   * `document` is intentionally NOT validated at the DB level. The Zod schema in
--     src/features/techpacks/schema/ is the contract; a schema_version mismatch is
--     a reader concern, never a migration.
--   * The partial unique index makes "set final" two statements. Doing that from
--     the client races the index and can leave ZERO finals for a product — always
--     go through set_techpack_final().
--   * Deleting a techpack row does NOT remove its storage objects. The service
--     removes objects first, mirroring mediaAssets.service.deleteMediaAsset.
--   * There is deliberately NO anon/public policy anywhere here, and unlike
--     story-media the bucket's SELECT is gated too. Techpack media reaches the
--     storefront only by promotion into cms_media_assets.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.set_techpack_final(uuid);
--   DROP TABLE IF EXISTS public.techpack_images;
--   DROP TABLE IF EXISTS public.techpacks;
--   DROP POLICY IF EXISTS techpacks_objects_editor_read   ON storage.objects;
--   DROP POLICY IF EXISTS techpacks_objects_editor_insert ON storage.objects;
--   DROP POLICY IF EXISTS techpacks_objects_editor_update ON storage.objects;
--   DROP POLICY IF EXISTS techpacks_objects_editor_delete ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'techpacks';

-- ---------------------------------------------------------------------------
-- public.techpacks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.techpacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'parsed', 'reviewed', 'imported', 'failed')),
  is_final boolean NOT NULL DEFAULT false,
  schema_version int NOT NULL DEFAULT 1,
  parser_version text NOT NULL DEFAULT '',
  source_filename text NOT NULL DEFAULT '',
  source_path text NOT NULL DEFAULT '',
  source_byte_size bigint NOT NULL DEFAULT 0,
  page_count int NOT NULL DEFAULT 0,
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_document jsonb,
  ai_status text NOT NULL DEFAULT 'none'
    CHECK (ai_status IN ('none', 'pending', 'ready', 'failed')),
  ai_error text NOT NULL DEFAULT '',
  issue_count int NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.techpacks IS
  'Supplier techpack PDFs parsed in the admin browser; document jsonb = TechpackDocument.';
COMMENT ON COLUMN public.techpacks.product_slug IS
  'Shopify handle / catalog slug this pack describes. Blank until assigned.';
COMMENT ON COLUMN public.techpacks.is_final IS
  'Exactly one final techpack per product_slug (partial unique index); set via set_techpack_final().';
COMMENT ON COLUMN public.techpacks.document IS
  'Parsed TechpackDocument. Never written by the AI step — deterministic extraction only.';
COMMENT ON COLUMN public.techpacks.ai_document IS
  'Optional AI rewrite overlay from the techpack-ai edge function; NEVER merged into document.';
COMMENT ON COLUMN public.techpacks.issue_count IS
  'Length of document.issues — surfaces the review queue in the admin list.';
COMMENT ON COLUMN public.techpacks.source_path IS
  'Object path inside the PRIVATE techpacks bucket. Read via createSignedUrl only.';

CREATE INDEX IF NOT EXISTS techpacks_product_slug_idx
  ON public.techpacks (product_slug) WHERE product_slug <> '';

CREATE INDEX IF NOT EXISTS techpacks_created_at_idx
  ON public.techpacks (created_at DESC);

-- One final pack per product. Blank slugs are unassigned drafts and exempt.
CREATE UNIQUE INDEX IF NOT EXISTS techpacks_final_per_product_key
  ON public.techpacks (product_slug) WHERE is_final AND product_slug <> '';

-- ---------------------------------------------------------------------------
-- public.techpack_images
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.techpack_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  techpack_id uuid NOT NULL REFERENCES public.techpacks (id) ON DELETE CASCADE,
  ref_id text NOT NULL,
  page int NOT NULL DEFAULT 0,
  role text NOT NULL DEFAULT 'unknown',
  storage_path text NOT NULL,
  mime text NOT NULL DEFAULT 'image/webp',
  width int,
  height int,
  byte_size bigint NOT NULL DEFAULT 0,
  promoted_media_id uuid REFERENCES public.cms_media_assets (id) ON DELETE SET NULL,
  promoted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.techpack_images IS
  'Images extracted from a techpack PDF. Private until promoted into cms_media_assets.';
COMMENT ON COLUMN public.techpack_images.ref_id IS
  'Matches TechpackDocument.images[].id so the parsed document can reference an object.';
COMMENT ON COLUMN public.techpack_images.role IS
  'garment-flat | graphic | swatch | knit | label | trim | unknown.';
COMMENT ON COLUMN public.techpack_images.promoted_media_id IS
  'ON DELETE SET NULL by design: removing a promoted asset from the media library must
   not cascade-delete the techpack provenance record.';

CREATE UNIQUE INDEX IF NOT EXISTS techpack_images_ref_key
  ON public.techpack_images (techpack_id, ref_id);

CREATE INDEX IF NOT EXISTS techpack_images_promoted_idx
  ON public.techpack_images (promoted_media_id) WHERE promoted_media_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS — CMS roles only. No anon policy on either table.
-- ---------------------------------------------------------------------------

ALTER TABLE public.techpacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.techpack_images ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['techpacks', 'techpack_images'] LOOP
    EXECUTE format($f$
      CREATE POLICY %1$s_select_cms ON public.%1$s
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid()
              AND p.role IN ('viewer', 'editor', 'admin')
          )
        );
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY %1$s_insert_editor ON public.%1$s
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid()
              AND p.role IN ('editor', 'admin')
          )
        );
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY %1$s_update_editor ON public.%1$s
        FOR UPDATE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid()
              AND p.role IN ('editor', 'admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid()
              AND p.role IN ('editor', 'admin')
          )
        );
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY %1$s_delete_editor ON public.%1$s
        FOR DELETE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.cms_profiles AS p
            WHERE p.user_id = auth.uid()
              AND p.role IN ('editor', 'admin')
          )
        );
    $f$, t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.techpacks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.techpack_images TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket — PRIVATE. Observed packs are 45-74 MB, so the cap is 100 MB
-- (cms-media's 50 MB cap cannot hold them, and it is public besides).
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'techpacks',
  'techpacks',
  false,
  104857600, -- 100 MB
  ARRAY['application/pdf', 'image/webp', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Unlike story-media there is NO public read policy: SELECT is gated too, and
-- the admin reads objects through createSignedUrl.
CREATE POLICY techpacks_objects_editor_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'techpacks'
    AND EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY techpacks_objects_editor_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'techpacks'
    AND EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY techpacks_objects_editor_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'techpacks'
    AND EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (bucket_id = 'techpacks');

CREATE POLICY techpacks_objects_editor_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'techpacks'
    AND EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- set_techpack_final — clearing the old final and setting the new one is two
-- statements; done from the client they race the partial unique index and can
-- leave a product with zero finals. Caller must be a CMS editor/admin.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_techpack_final(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_uid uuid := auth.uid();
  v_slug text;
begin
  if v_uid is null or not exists (
    select 1 from public.cms_profiles
     where user_id = v_uid and role in ('editor', 'admin')
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_authorized');
  end if;

  select product_slug into v_slug from public.techpacks where id = p_id;
  if v_slug is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_slug = '' then
    return jsonb_build_object('ok', false, 'error', 'no_product');
  end if;

  update public.techpacks
     set is_final = false, updated_at = now()
   where product_slug = v_slug and is_final and id <> p_id;

  update public.techpacks
     set is_final = true, updated_at = now()
   where id = p_id;

  return jsonb_build_object('ok', true);
end;
$$;

REVOKE ALL ON FUNCTION public.set_techpack_final(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_techpack_final(uuid) TO authenticated;
