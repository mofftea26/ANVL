-- Shopify commerce link table; deprecate medusa_product_id naming on cms_admin_products.

ALTER TABLE public.cms_admin_products
  ADD COLUMN IF NOT EXISTS shopify_product_gid text;

COMMENT ON COLUMN public.cms_admin_products.shopify_product_gid IS
  'Optional Shopify Product GID for legacy rows; catalog truth lives in Shopify when headless.';

COMMENT ON COLUMN public.cms_admin_products.medusa_product_id IS
  'Deprecated — use shopify_product_gid or Shopify metafields only.';

CREATE TABLE IF NOT EXISTS public.shopify_product_links (
  slug text PRIMARY KEY,
  shopify_product_gid text NOT NULL,
  shopify_handle text NOT NULL,
  drop_client_ids text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shopify_product_links IS
  'Optional ANVL slug ↔ Shopify product mapping; primary linking is Shopify metafield anvl.drop_ids.';

ALTER TABLE public.shopify_product_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY shopify_product_links_admin_all
  ON public.shopify_product_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.cms_profiles AS p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopify_product_links TO authenticated;

ALTER TABLE public.storefront_publication
  ADD COLUMN IF NOT EXISTS shopify_catalog_synced_at timestamptz;

COMMENT ON COLUMN public.storefront_publication.shopify_catalog_synced_at IS
  'Last Shopify webhook or manual catalog sync timestamp; products_snapshot is legacy when Shopify is enabled.';
