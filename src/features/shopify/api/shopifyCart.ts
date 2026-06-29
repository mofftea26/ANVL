import type { CartLine } from '@/features/cart/types/cart.types'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import { shopifyStorefrontRequest } from '@/features/shopify/api/shopifyStorefrontClient'

const CART_CREATE_MUTATION = `
  mutation AnvlCartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`

type CartCreateData = {
  cartCreate: {
    cart: { id: string; checkoutUrl: string } | null
    userErrors: Array<{ field: string[] | null; message: string }>
  }
}

/**
 * Create a Shopify cart from local cart lines and return the hosted checkout URL.
 * Returns `null` when Shopify is not configured or no line carries a Shopify
 * variant GID (e.g. a stale cart built against the seed/local catalog), so the
 * caller can fall back to the internal checkout flow.
 */
export async function createShopifyCheckout(
  lines: CartLine[],
): Promise<string | null> {
  const env = getShopifyPublicEnv()
  if (!env) return null

  const cartLines = lines
    .filter((line) => Boolean(line.variantId))
    .map((line) => ({
      merchandiseId: line.variantId as string,
      quantity: line.quantity,
    }))

  if (cartLines.length === 0) return null

  const data = await shopifyStorefrontRequest<CartCreateData>(
    env,
    CART_CREATE_MUTATION,
    { lines: cartLines },
  )

  const errors = data.cartCreate.userErrors
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join('; '))
  }

  return data.cartCreate.cart?.checkoutUrl ?? null
}
