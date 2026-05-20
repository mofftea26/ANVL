import type { Product } from '@/features/products/types/product.types'

/** Act-level productIds override the default first-six storefront slice. */
export function resolveProductShowcaseProducts(
  products: Product[],
  productIds?: string[],
): Product[] {
  if (!productIds?.length) return products.slice(0, 6)
  return productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product != null)
}
