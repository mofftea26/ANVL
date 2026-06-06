-- Storefront customer profiles (separate from CMS cms_profiles). ADDITIVE.
--
-- Backs the public storefront account when Supabase auth is configured
-- (email/password + Google/Facebook/Apple OAuth). One row per auth user,
-- auto-created on signup. Orders remain in the commerce backend (mock until
-- Shopify/Medusa) — this table is identity/profile only.
--
-- Applied 2026-06-06 via Supabase MCP (idempotent: DROP-then-CREATE guards).

CREATE TABLE IF NOT EXISTS public.storefront_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.storefront_profiles IS
  'Public storefront customer identity/profile, one row per auth user. RLS: users read/update their own row.';

DROP TRIGGER IF EXISTS storefront_profiles_touch_updated_at ON public.storefront_profiles;
CREATE TRIGGER storefront_profiles_touch_updated_at
  BEFORE UPDATE ON public.storefront_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_row_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_storefront_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.storefront_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- This is a trigger function only; revoke the implicit PUBLIC EXECUTE so it is
-- not callable as a REST RPC (security advisor 0028/0029). The trigger still
-- fires on INSERT regardless of EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.handle_new_storefront_user() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS on_auth_user_created_storefront ON auth.users;
CREATE TRIGGER on_auth_user_created_storefront
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_storefront_user();

-- ---------------------------------------------------------------------------
-- Row Level Security — users see and edit only their own row.
-- ---------------------------------------------------------------------------
ALTER TABLE public.storefront_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storefront_profiles_select_self ON public.storefront_profiles;
CREATE POLICY storefront_profiles_select_self
  ON public.storefront_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS storefront_profiles_insert_self ON public.storefront_profiles;
CREATE POLICY storefront_profiles_insert_self
  ON public.storefront_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS storefront_profiles_update_self ON public.storefront_profiles;
CREATE POLICY storefront_profiles_update_self
  ON public.storefront_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.storefront_profiles TO authenticated;
