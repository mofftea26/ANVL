-- Allow 3D model (GLB/GLTF) uploads to the cms-media bucket so products can carry
-- a 3D model assigned from the CMS (The Oath "Arsenal" product showcase).
-- Idempotent: appends the model mimes to the existing allow-list.
update storage.buckets
set allowed_mime_types = (
  select array(
    select distinct unnest(
      allowed_mime_types || array['model/gltf-binary', 'model/gltf+json']
    )
  )
)
where id = 'cms-media';
