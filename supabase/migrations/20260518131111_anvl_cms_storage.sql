-- CMS media bucket: public object URLs; writes restricted to CMS editors/admins.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cms-media',
  'cms-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY cms_media_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'cms-media');

CREATE POLICY cms_media_editor_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cms-media'
    AND EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY cms_media_editor_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cms-media'
    AND EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (bucket_id = 'cms-media');

CREATE POLICY cms_media_editor_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cms-media'
    AND EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('editor', 'admin')
    )
  );
