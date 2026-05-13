import type { CommerceClient } from '@/app/config/clients'
import {
  getStorefrontProductBySlug,
  getStorefrontProductsForHome,
  getStorefrontProductsForShop,
} from '@/features/admin/products/products.commerce'

export const mockCommerceClient: CommerceClient = {
  async getProducts() {
    return getStorefrontProductsForShop()
  },
  async getHomeProducts() {
    return getStorefrontProductsForHome()
  },
  async getProductBySlug(slug) {
    return getStorefrontProductBySlug(slug)
  },
  async getRelatedProducts(slug) {
    return getStorefrontProductsForShop()
      .filter((item) => item.slug !== slug)
      .slice(0, 2)
  },
}
