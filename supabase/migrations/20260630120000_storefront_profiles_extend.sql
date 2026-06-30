-- Extend storefront_profiles with phone, addresses, and notification prefs. ADDITIVE.
--
-- Completes the customer profile so /account/personal (phone) and
-- /account/addresses persist, and /account/settings can store notification
-- preferences. Existing self-RLS policies already cover every column; no policy
-- change needed. Applied 2026-06-30 via Supabase MCP.

ALTER TABLE public.storefront_profiles
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_updates_opt_in boolean NOT NULL DEFAULT true;
