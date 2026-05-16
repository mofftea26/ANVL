import type { CommerceClient } from '@/app/config/clients'
import {
  getRelatedStorefrontProducts,
  getStorefrontProductBySlug,
  getStorefrontProductsForHome,
  getStorefrontShopListingCatalog,
} from '@/features/admin/products/products.commerce'

export const localStorageCommerceClient: CommerceClient = {
  async getProducts() {
    const { items } = await getStorefrontShopListingCatalog()
    return items
  },
  async getHomeProducts() {
    return getStorefrontProductsForHome()
  },
  async getProductBySlug(slug) {
    return getStorefrontProductBySlug(slug)
  },
  async getRelatedProducts(slug) {
    return getRelatedStorefrontProducts(slug, 4)
  },
  async getShopListingCatalog() {
    return getStorefrontShopListingCatalog()
  },
}
