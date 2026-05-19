import type { CommerceClient } from '@/app/config/clients'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { fetchPublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'
import {
  buildStorefrontShopCatalogFromProjection,
  getRelatedStorefrontProductsFromProjection,
  getStorefrontProductBySlugFromProjection,
  getStorefrontProductsForHomeFromProjection,
} from '@/features/cms/api/storefrontPublicationCommerce'
import { localStorageCommerceClient } from '@/features/products/api/commerceClient.localStorage'
import { seedCommerceClient } from '@/features/products/api/commerceClient.seed'

async function withPublication<T>(
  fn: (p: NonNullable<Awaited<ReturnType<typeof fetchPublishedStorefrontProjection>>>) => T,
): Promise<{ ok: true; value: T } | { ok: false }> {
  const env = getSupabasePublicEnv()
  if (!env) return { ok: false }
  try {
    const p = await fetchPublishedStorefrontProjection(env)
    if (!p) return { ok: false }
    return { ok: true, value: fn(p) }
  } catch {
    return { ok: false }
  }
}

/** Seed on SSR; local admin catalog in the browser — same as the legacy storefront. */
function offlineCommerceClient(): CommerceClient {
  return typeof window === 'undefined'
    ? seedCommerceClient
    : localStorageCommerceClient
}

async function readWithOfflineFallback<T>(
  fromPublication: (
    p: NonNullable<Awaited<ReturnType<typeof fetchPublishedStorefrontProjection>>>,
  ) => T,
  offline: (client: CommerceClient) => Promise<T>,
): Promise<T> {
  const r = await withPublication(fromPublication)
  if (r.ok) return r.value
  return offline(offlineCommerceClient())
}

/**
 * Commerce reads from `storefront_publication` when available.
 * On failure or empty snapshot, falls back to seed (SSR) or local catalog (browser).
 */
export const supabaseCommerceClient: CommerceClient = {
  async getProducts() {
    return readWithOfflineFallback(
      (p) => buildStorefrontShopCatalogFromProjection(p).items,
      (c) => c.getProducts(),
    )
  },
  async getHomeProducts() {
    return readWithOfflineFallback(
      (p) => getStorefrontProductsForHomeFromProjection(p),
      (c) => c.getHomeProducts(),
    )
  },
  async getProductBySlug(slug: string) {
    return readWithOfflineFallback(
      (p) => getStorefrontProductBySlugFromProjection(p, slug),
      (c) => c.getProductBySlug(slug),
    )
  },
  async getRelatedProducts(slug: string) {
    return readWithOfflineFallback(
      (p) => getRelatedStorefrontProductsFromProjection(p, slug, 4),
      (c) => c.getRelatedProducts(slug),
    )
  },
  async getShopListingCatalog() {
    return readWithOfflineFallback(
      (p) => buildStorefrontShopCatalogFromProjection(p),
      (c) => c.getShopListingCatalog(),
    )
  },
}
