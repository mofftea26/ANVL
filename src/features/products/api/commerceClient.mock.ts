import type { CommerceClient } from '@/app/config/clients'
import { productsSchema } from '../schemas/product.schema'
import { productsMock } from '../data/products.mock'

const parsed = productsSchema.parse(productsMock)

export const mockCommerceClient: CommerceClient = {
  async getProducts() {
    return parsed
  },
  async getProductBySlug(slug) {
    return parsed.find((item) => item.slug === slug) ?? null
  },
  async getRelatedProducts(slug) {
    return parsed.filter((item) => item.slug !== slug).slice(0, 2)
  },
}
