import type { CommerceClient } from '@/app/config/clients'
import {
  getStorefrontProductBySlug,
  getStorefrontProductsForHome,
  getStorefrontProductsForShop,
} from '@/features/admin/products/products.commerce'

/**
 * Browser commerce — catalog + drop assignment hydrate from local admin storage.
 * TODO: replace with Medusa-backed `CommerceClient` when commerce API is available.
 */
export const localStorageCommerceClient: CommerceClient = {
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
