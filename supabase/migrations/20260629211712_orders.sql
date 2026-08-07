-- Customer order mirror. Shopify is the system of record for orders; the
-- `shopify-webhook` Edge Function writes a denormalized copy here (service role)
-- so the storefront account can show order history. ADDITIVE.
-- Applied 2026-06-30 via Supabase MCP.

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text UNIQUE NOT NULL,
  order_number text,
  customer_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text,
  payment_method text,
  shipping_address jsonb,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS
  'Denormalized Shopify order mirror for storefront account history. Writes via service role (webhook); RLS scopes reads to the owning customer.';

CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders (lower(email));
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers read their own orders: by linked user id, or by matching email claim
-- (covers guest orders placed before sign-up, and orders not yet id-linked).
DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- No INSERT/UPDATE/DELETE policies → only the service role (webhook) can write.
GRANT SELECT ON public.orders TO authenticated;
