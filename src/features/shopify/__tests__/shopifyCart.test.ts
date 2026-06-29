import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CartLine } from '@/features/cart/types/cart.types'
import { createShopifyCheckout } from '@/features/shopify/api/shopifyCart'
import * as env from '@/features/shopify/config/shopifyPublicEnv'

const baseLine: CartLine = {
  productId: 'p1',
  slug: 'oversized-tee',
  name: 'Oversized Tee',
  price: 48,
  colorway: 'Onyx',
  size: 'M',
  quantity: 2,
  image: '/x.jpg',
  variantId: 'gid://shopify/ProductVariant/10',
}

function mockEnv() {
  vi.spyOn(env, 'getShopifyPublicEnv').mockReturnValue({
    storeDomain: 'anvl-2.myshopify.com',
    storefrontApiVersion: '2025-01',
    storefrontAccessToken: 'token',
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createShopifyCheckout', () => {
  it('returns null when Shopify env is not configured', async () => {
    vi.spyOn(env, 'getShopifyPublicEnv').mockReturnValue(null)
    expect(await createShopifyCheckout([baseLine])).toBeNull()
  })

  it('returns null when no line carries a Shopify variant GID', async () => {
    mockEnv()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const result = await createShopifyCheckout([{ ...baseLine, variantId: undefined }])
    expect(result).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('creates a cart and returns the hosted checkout URL', async () => {
    mockEnv()
    const checkoutUrl = 'https://anvl-2.myshopify.com/cart/c/abc'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          cartCreate: {
            cart: { id: 'gid://shopify/Cart/1', checkoutUrl },
            userErrors: [],
          },
        },
      }),
    } as Response)

    expect(await createShopifyCheckout([baseLine])).toBe(checkoutUrl)
  })

  it('throws when Shopify returns cart userErrors', async () => {
    mockEnv()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          cartCreate: {
            cart: null,
            userErrors: [{ field: ['lines'], message: 'Invalid merchandise' }],
          },
        },
      }),
    } as Response)

    await expect(createShopifyCheckout([baseLine])).rejects.toThrow(
      'Invalid merchandise',
    )
  })
})
