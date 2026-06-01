import type { Product } from '@/features/products/types/product.types'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'

export function resolveProductHref(product: Product): string {
  const env = getShopifyPublicEnv()
  if (env) {
    return `https://${env.storeDomain}/products/${product.slug}`
  }
  return `/shop/${product.slug}`
}

export function formatProductPrice(product: Product): string {
  const currency = product.shop?.currency ?? 'USD'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(product.price)
  } catch {
    return `$${product.price.toFixed(2)}`
  }
}

export function productSaleLabel(product: Product): string | null {
  if (product.shop?.saleLabel) return product.shop.saleLabel
  if (product.shop?.storefrontStatus === 'sale') return 'Sale'
  if (product.shop?.compareAtPrice && product.shop.compareAtPrice > product.price) {
    return 'Sale'
  }
  return null
}

export function productAvailabilityLabel(product: Product): string {
  const status = product.shop?.storefrontStatus
  if (status === 'outOfStock') return 'Sold out'
  if (status === 'comingSoon') return 'Coming soon'
  if (status === 'limitedEdition') return 'Limited'
  return 'Available'
}

export function pickFeaturedProducts(
  products: Product[],
  productIds: string[] | undefined,
  limit = 6,
): Product[] {
  if (productIds?.length) {
    const byId = new Map(products.map((p) => [p.id, p]))
    const picked = productIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p))
    if (picked.length) return picked.slice(0, limit)
  }
  return products.slice(0, limit)
}
