import { describe, expect, it } from 'vitest'
import type { Product, ProductShopMeta } from '@/features/products/types/product.types'
import {
  productIsOnSale,
  resolveProductBadge,
} from '@/features/products/components/ProductCardBadge'

function shopMeta(overrides: Partial<ProductShopMeta>): ProductShopMeta {
  return {
    storefrontStatus: 'available',
    sourceType: 'drop',
    dropId: null,
    dropSlug: null,
    compareAtPrice: null,
    listPrice: 0,
    currency: 'USD',
    category: '',
    availabilityByColorAndSize: {},
    imagesByColorName: {},
    ...overrides,
  }
}

function makeProduct(shop?: ProductShopMeta): Product {
  return {
    id: 'p',
    slug: 'p',
    name: 'Piece',
    dropName: 'The Oath',
    role: '',
    fit: '',
    fabric: '',
    gsm: '',
    storytelling: '',
    designDetails: [],
    careInstructions: [],
    colorways: [],
    sizes: [],
    price: 50,
    images: [],
    shop,
  }
}

describe('resolveProductBadge', () => {
  it('maps storefront statuses to labelled badges', () => {
    expect(resolveProductBadge(makeProduct(shopMeta({ storefrontStatus: 'outOfStock' })), false))
      .toMatchObject({ label: 'Sold out', tone: 'muted' })
    expect(resolveProductBadge(makeProduct(shopMeta({ storefrontStatus: 'comingSoon' })), false))
      .toMatchObject({ label: 'Coming soon', tone: 'warning' })
    expect(resolveProductBadge(makeProduct(shopMeta({ storefrontStatus: 'sale' })), false))
      .toMatchObject({ label: 'Sale', tone: 'sale' })
    expect(resolveProductBadge(makeProduct(shopMeta({ storefrontStatus: 'limitedEdition' })), false))
      .toMatchObject({ label: 'Limited', tone: 'accent' })
  })

  it('returns null for an available product with no urgency', () => {
    expect(resolveProductBadge(makeProduct(shopMeta({})), false)).toBeNull()
    expect(resolveProductBadge(makeProduct(undefined), false)).toBeNull()
  })

  it('derives the sale badge from compare-at pricing even when status is available', () => {
    const discounted = makeProduct(
      shopMeta({ storefrontStatus: 'available', compareAtPrice: 74, listPrice: 59 }),
    )
    expect(productIsOnSale(discounted)).toBe(true)
    expect(resolveProductBadge(discounted, false)).toMatchObject({
      label: 'Sale',
      tone: 'sale',
    })

    const fullPrice = makeProduct(
      shopMeta({ storefrontStatus: 'available', compareAtPrice: 59, listPrice: 59 }),
    )
    expect(productIsOnSale(fullPrice)).toBe(false)
    expect(resolveProductBadge(fullPrice, false)).toBeNull()
  })

  it('keeps sold-out precedence over a discounted price', () => {
    const soldOutSale = makeProduct(
      shopMeta({ storefrontStatus: 'outOfStock', compareAtPrice: 74, listPrice: 59 }),
    )
    expect(resolveProductBadge(soldOutSale, false)).toMatchObject({ label: 'Sold out' })
  })

  it('flags real low stock only when urgency is enabled', () => {
    const lowStock = makeProduct(
      shopMeta({ availabilityByColorAndSize: { Black: { M: 2, L: 1 } } }),
    )
    expect(resolveProductBadge(lowStock, false)).toBeNull()
    expect(resolveProductBadge(lowStock, true)).toMatchObject({ label: 'Low stock' })

    const wellStocked = makeProduct(
      shopMeta({ availabilityByColorAndSize: { Black: { M: 20, L: 30 } } }),
    )
    expect(resolveProductBadge(wellStocked, true)).toBeNull()
  })
})
