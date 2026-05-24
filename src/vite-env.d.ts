/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  /** Local CMS demo login — bundled client-side; dev/demo only. */
  readonly VITE_ANVL_ADMIN_USERNAME?: string
  readonly VITE_ANVL_ADMIN_PASSWORD?: string
  /** When `"true"`, non-Lebanon shipping shows card (mock) checkout in the storefront. */
  readonly VITE_ANVL_INTERNATIONAL_CHECKOUT?: string
  /** Supabase project URL (public). */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase publishable key (`sb_publishable_…`) — preferred browser key. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Shopify store host, e.g. your-store.myshopify.com */
  readonly VITE_SHOPIFY_STORE_DOMAIN?: string
  readonly VITE_SHOPIFY_STOREFRONT_API_VERSION?: string
  readonly VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN?: string
}
