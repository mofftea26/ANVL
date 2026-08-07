-- Richer customer profile: birthdate, gender, body measurements, preferred size.
-- ADDITIVE. Measurements power future size suggestions on PDPs. Existing
-- self-RLS already covers every column. Applied 2026-06-30 via Supabase MCP.

ALTER TABLE public.storefront_profiles
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_size text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS measurements jsonb NOT NULL DEFAULT '{}'::jsonb;
