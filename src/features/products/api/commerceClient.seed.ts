import type { CommerceClient } from '@/app/config/clients'
import {
  getStorefrontProductBySlug,
  getStorefrontProductsForHome,
  getStorefrontShopListingCatalog,
} from '@/features/products/catalog/storefrontCatalog'

/**
 * Storefront commerce — on the server, admin services resolve to in-memory seed catalog
 * and default oath drop (storage reads short-circuit when `window` is undefined).
 * SSR seed catalog when neither Shopify nor Supabase commerce is configured.
 */
export const seedCommerceClient: CommerceClient = {
  async getProducts() {
    const { items } = getStorefrontShopListingCatalog()
    return items
  },
  async getHomeProducts() {
    return getStorefrontProductsForHome()
  },
  async getProductBySlug(slug: string) {
    return getStorefrontProductBySlug(slug)
  },
  async getRelatedProducts(slug: string) {
    const { items } = getStorefrontShopListingCatalog()
    return items.filter((item) => item.slug !== slug).slice(0, 4)
  },
  async getShopListingCatalog() {
    return getStorefrontShopListingCatalog()
  },
  async startCheckout() {
    return null
  },
}
