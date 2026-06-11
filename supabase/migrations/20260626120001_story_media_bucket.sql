-- Dedicated public bucket for story media (images + short video clips).
-- Kept separate from cms-media so the larger size cap + video MIME types
-- do not affect the image-only CMS pipeline.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-media',
  'story-media',
  true,
  524288000, -- 500 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY story_media_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'story-media');

CREATE POLICY story_media_editor_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'story-media'
    AND EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );

CREATE POLICY story_media_editor_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'story-media'
    AND EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  )
  WITH CHECK (bucket_id = 'story-media');

CREATE POLICY story_media_editor_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'story-media'
    AND EXISTS (
      SELECT 1 FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid() AND p.role IN ('editor', 'admin')
    )
  );
