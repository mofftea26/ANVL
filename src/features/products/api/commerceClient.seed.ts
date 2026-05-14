import type { CommerceClient } from '@/app/config/clients'
import {
  getStorefrontProductBySlug,
  getStorefrontProductsForHome,
  getStorefrontProductsForShop,
} from '@/features/admin/products/products.commerce'

/**
 * Storefront commerce — on the server, admin services resolve to in-memory seed catalog
 * and default oath drop (storage reads short-circuit when `window` is undefined).
 * TODO: replace with Medusa-backed `CommerceClient` when commerce API is available.
 */
export const seedCommerceClient: CommerceClient = {
  async getProducts() {
    return getStorefrontProductsForShop()
  },
  async getHomeProducts() {
    return getStorefrontProductsForHome()
  },
  async getProductBySlug(slug: string) {
    return getStorefrontProductBySlug(slug)
  },
  async getRelatedProducts(slug: string) {
    return getStorefrontProductsForShop()
      .filter((item) => item.slug !== slug)
      .slice(0, 2)
  },
}
