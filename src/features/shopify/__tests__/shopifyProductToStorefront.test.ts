import { describe, expect, it } from 'vitest'
import {
  mapShopifyProductNodeToStorefront,
  productMatchesDropId,
} from '@/features/shopify/mappers/shopifyProductToStorefront'

const sampleNode = {
  id: 'gid://shopify/Product/1',
  handle: 'oversized-tee-oath',
  title: 'Oversized Tee',
  description: 'Heavy cotton.',
  featuredImage: { url: 'https://cdn.shopify.com/x.jpg', altText: 'Tee' },
  priceRange: { minVariantPrice: { amount: '49.00', currencyCode: 'USD' } },
  variants: {
    edges: [
      {
        node: {
          id: 'gid://shopify/ProductVariant/1',
          title: 'Black / M',
          availableForSale: true,
          price: { amount: '49.00', currencyCode: 'USD' },
          selectedOptions: [
            { name: 'Color', value: 'Black' },
            { name: 'Size', value: 'M' },
          ],
        },
      },
    ],
  },
  metafield: { value: '["drop-oath-01"]' },
}

describe('shopifyProductToStorefront', () => {
  it('maps handle to slug and parses drop_ids metafield', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.slug).toBe('oversized-tee-oath')
    expect(p.shop?.dropIds).toEqual(['drop-oath-01'])
    expect(p.price).toBe(49)
  })

  it('productMatchesDropId checks dropIds array', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(productMatchesDropId(p, 'drop-oath-01')).toBe(true)
    expect(productMatchesDropId(p, 'other')).toBe(false)
  })
})
