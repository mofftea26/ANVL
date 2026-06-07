import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'
import { productsMock } from '@/features/products/data/products.mock'

export function getStorefrontShopListingCatalog(): {
  items: Product[]
  drops: ShopDropFilterOption[]
} {
  return { items: [...productsMock], drops: [] }
}

export function getStorefrontProductsForHome(): Product[] {
  return productsMock.slice(0, 8)
}

export function getStorefrontProductBySlug(slug: string): Product | null {
  return productsMock.find((p) => p.slug === slug) ?? null
}

export function getRelatedStorefrontProducts(slug: string, limit = 4): Product[] {
  return productsMock.filter((p) => p.slug !== slug).slice(0, limit)
}

export function getAdminProductBySlug(slug: string): Product | null {
  return getStorefrontProductBySlug(slug)
}

export function effectivePrice(product: Product): number {
  return product.shop?.listPrice ?? product.price
}

export function variantIsPurchasable(
  product: Product,
  _colorwayIndex = 0,
  _size?: string,
): boolean {
  const status = product.shop?.storefrontStatus ?? 'available'
  return (
    status === 'available' ||
    status === 'sale' ||
    status === 'limitedEdition'
  )
}
