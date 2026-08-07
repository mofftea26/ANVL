import type { CartLine } from '@/features/cart/types/cart.types'
import type { CheckoutBuyer } from '@/app/config/clients'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import { shopifyStorefrontRequest } from '@/features/shopify/api/shopifyStorefrontClient'

const CART_CREATE_MUTATION = `
  mutation AnvlCartCreate($lines: [CartLineInput!]!, $buyerIdentity: CartBuyerIdentityInput) {
    cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentity }) {
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
 * caller can fall back to the internal checkout flow. When a signed-in buyer's
 * email is passed, it is attached to the cart so the order ties to their account.
 */
export async function createShopifyCheckout(
  lines: CartLine[],
  buyer?: CheckoutBuyer,
): Promise<string | null> {
  const env = getShopifyPublicEnv()
  if (!env) return null

  const resolvable = lines.filter((line) => Boolean(line.variantId))

  // No line resolved a Shopify variant — the whole cart was built against the
  // seed/local catalog. Report "not a Shopify cart" and let the caller decide.
  if (resolvable.length === 0) return null

  // Some resolved and some did not. Checking out only the resolvable subset
  // would silently charge the buyer for part of their cart, so refuse: the
  // caller surfaces this instead of quietly shipping a smaller order.
  if (resolvable.length !== lines.length) {
    const unavailable = lines
      .filter((line) => !line.variantId)
      .map((line) => `${line.name} (${line.colorway} · ${line.size})`)
    throw new Error(
      `Some items are unavailable for checkout: ${unavailable.join(', ')}. Remove them and try again.`,
    )
  }

  const cartLines = resolvable.map((line) => ({
    merchandiseId: line.variantId as string,
    quantity: line.quantity,
  }))

  const buyerIdentity =
    buyer && (buyer.email || buyer.countryCode)
      ? {
          ...(buyer.email ? { email: buyer.email } : {}),
          ...(buyer.countryCode ? { countryCode: buyer.countryCode } : {}),
        }
      : undefined

  const data = await shopifyStorefrontRequest<CartCreateData>(
    env,
    CART_CREATE_MUTATION,
    { lines: cartLines, buyerIdentity },
  )

  const errors = data.cartCreate.userErrors
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join('; '))
  }

  return data.cartCreate.cart?.checkoutUrl ?? null
}
