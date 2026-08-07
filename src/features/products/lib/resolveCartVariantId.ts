import type { Product } from '@/features/products/types/product.types'

/**
 * Shopify's variant GID for a (colorway, size) pair, or `undefined`.
 *
 * WHY THIS IS ONE FUNCTION: this value decides whether a line can be checked
 * out through Shopify's hosted checkout at all. `createShopifyCheckout` drops
 * lines without it — and now refuses a cart where only some lines resolve — so
 * a miss here is the difference between a real order and a blocked one.
 *
 * It used to be hand-written at three independent call sites
 * (`ProductCardQuickAdd`, `usePdpVariant`, `ProductQuickView`), each repeating
 * the same double lookup and the same two magic fallback keys, and none of them
 * asserted on it. Three copies of a money-critical lookup is three chances to
 * drift; this is the one copy, and it is unit-tested.
 *
 * The `'Default'` / `'One Size'` fallbacks mirror how the Shopify mapper keys
 * single-option products (`shopifyProductToStorefront.ts`): a product with no
 * real colourway is stored under `Default`, one with no real size under
 * `One Size`. An empty string from the UI means "no choice offered", which is
 * exactly those cases.
 */
export function resolveCartVariantId(
  product: Pick<Product, 'shop'>,
  colorName: string | undefined,
  size: string | undefined,
): string | undefined {
  const byColor = product.shop?.variantIdByColorAndSize
  if (!byColor) return undefined
  return byColor[colorName || 'Default']?.[size || 'One Size']
}
