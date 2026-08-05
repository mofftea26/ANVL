-- Published homepage mode: `default` = cinematic landing, `custom` = active drop acts.
ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS site_homepage jsonb NOT NULL DEFAULT '{"mode":"custom","updatedAt":""}'::jsonb;

COMMENT ON COLUMN public.storefront_publication.site_homepage IS
  'Homepage routing: { mode: "default" | "custom", updatedAt }. Synced from admin dashboard.';
