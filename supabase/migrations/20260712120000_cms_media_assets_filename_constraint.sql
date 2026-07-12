-- Admin can now rename media assets (updates `filename` in place, does not
-- move the underlying storage object). Guard against blanking it out.

ALTER TABLE public.cms_media_assets
  ADD CONSTRAINT cms_media_assets_filename_not_blank CHECK (btrim(filename) <> '');
