export type ShopifyPublicEnv = {
  storeDomain: string
  storefrontApiVersion: string
  storefrontAccessToken: string
}

/**
 * Shopify Storefront API credentials (safe in the browser bundle).
 * Admin API tokens must never use the `VITE_` prefix.
 */
export function getShopifyPublicEnv(): ShopifyPublicEnv | null {
  const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN?.trim()
  const storefrontAccessToken =
    import.meta.env.VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN?.trim()
  const storefrontApiVersion =
    import.meta.env.VITE_SHOPIFY_STOREFRONT_API_VERSION?.trim() || '2025-01'

  if (!storeDomain || !storefrontAccessToken) return null
  return {
    storeDomain: storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    storefrontApiVersion,
    storefrontAccessToken,
  }
}

export function getShopifyAdminUrl(path = ''): string | null {
  const env = getShopifyPublicEnv()
  if (!env) return null
  const base = `https://${env.storeDomain}/admin`
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base
}
