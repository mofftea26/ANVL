-- CMS media asset catalog (metadata for cms-media bucket objects).

CREATE TABLE public.cms_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  alt text NOT NULL DEFAULT '',
  mime text NOT NULL,
  byte_size bigint NOT NULL,
  width int,
  height int,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX cms_media_assets_created_at_idx
  ON public.cms_media_assets (created_at DESC);

CREATE INDEX cms_media_assets_filename_idx
  ON public.cms_media_assets (filename);

COMMENT ON TABLE public.cms_media_assets IS
  'Catalog of objects in the cms-media bucket; synced to storefront_publication.media_index on admin save.';

ALTER TABLE public.cms_media_assets ENABLE ROW LEVEL SECURITY;

-- SELECT: all CMS roles (viewer, editor, admin)
CREATE POLICY cms_media_assets_select_cms
  ON public.cms_media_assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY cms_media_assets_insert_editor
  ON public.cms_media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY cms_media_assets_update_editor
  ON public.cms_media_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY cms_media_assets_delete_editor
  ON public.cms_media_assets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media_assets TO authenticated;
