import type { CommerceClient } from '@/app/config/clients'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { fetchPublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'
import {
  buildStorefrontShopCatalogFromProjection,
  getRelatedStorefrontProductsFromProjection,
  getStorefrontProductBySlugFromProjection,
  getStorefrontProductsForHomeFromProjection,
} from '@/features/cms/api/storefrontPublicationCommerce'
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

/**
 * Commerce reads from the published `storefront_publication` snapshot (anon key).
 * Falls back to {@link seedCommerceClient} on the server and would use local catalog
 * in the browser when `VITE_SUPABASE_*` is unset — here we mirror CMS: when Supabase
 * is configured but the projection is missing or empty, we still fall back to seed
 * on the server and to seed on the client (localStorage path is selected in runtime.ts
 * only when Supabase env is absent).
 */
export const supabaseCommerceClient: CommerceClient = {
  async getProducts() {
    const r = await withPublication((p) => buildStorefrontShopCatalogFromProjection(p).items)
    return r.ok ? r.value : seedCommerceClient.getProducts()
  },
  async getHomeProducts() {
    const r = await withPublication((p) => getStorefrontProductsForHomeFromProjection(p))
    return r.ok ? r.value : seedCommerceClient.getHomeProducts()
  },
  async getProductBySlug(slug: string) {
    const r = await withPublication((p) => getStorefrontProductBySlugFromProjection(p, slug))
    return r.ok ? r.value : seedCommerceClient.getProductBySlug(slug)
  },
  async getRelatedProducts(slug: string) {
    const r = await withPublication((p) =>
      getRelatedStorefrontProductsFromProjection(p, slug, 4),
    )
    return r.ok ? r.value : seedCommerceClient.getRelatedProducts(slug)
  },
  async getShopListingCatalog() {
    const r = await withPublication((p) => buildStorefrontShopCatalogFromProjection(p))
    return r.ok ? r.value : seedCommerceClient.getShopListingCatalog()
  },
}
