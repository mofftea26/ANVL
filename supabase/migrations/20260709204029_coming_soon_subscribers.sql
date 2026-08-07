-- Early-access email capture for the Coming Soon reveal page. ADDITIVE.
--
-- Write-only mailbox: anon/authenticated may INSERT a row (the public signup
-- form posts directly with the publishable key) but may never read the list.
-- Only CMS admins can SELECT. Duplicate signups are rejected by the
-- case-insensitive unique index and surfaced as a friendly "already on the
-- list" success in the UI.
-- Applied 2026-07-09 via Supabase MCP.

CREATE TABLE IF NOT EXISTS public.coming_soon_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'coming-soon',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.coming_soon_subscribers IS
  'Early-access signups from the Coming Soon page. Anon INSERT only (write-only mailbox); CMS admins read.';

CREATE UNIQUE INDEX IF NOT EXISTS coming_soon_subscribers_email_key
  ON public.coming_soon_subscribers (lower(email));

ALTER TABLE public.coming_soon_subscribers ENABLE ROW LEVEL SECURITY;

-- Public signup: anyone may add themselves. Basic shape guard only — real
-- validation is client-side Zod; the unique index handles duplicates.
DROP POLICY IF EXISTS coming_soon_subscribers_insert_public
  ON public.coming_soon_subscribers;
CREATE POLICY coming_soon_subscribers_insert_public
  ON public.coming_soon_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(email) BETWEEN 5 AND 320
    AND position('@' IN email) > 1
  );

-- Only CMS admins may read the list. No UPDATE/DELETE policies → immutable
-- except via service role.
DROP POLICY IF EXISTS coming_soon_subscribers_select_admin
  ON public.coming_soon_subscribers;
CREATE POLICY coming_soon_subscribers_select_admin
  ON public.coming_soon_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

GRANT INSERT ON public.coming_soon_subscribers TO anon, authenticated;
GRANT SELECT ON public.coming_soon_subscribers TO authenticated;
