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
  images: {
    edges: [
      { node: { url: 'https://cdn.shopify.com/black-front.jpg', altText: 'Black — front' } },
      { node: { url: 'https://cdn.shopify.com/black-back.jpg', altText: 'Black — back' } },
      { node: { url: 'https://cdn.shopify.com/bone-front.jpg', altText: 'Bone — front' } },
    ],
  },
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

  it('maps all gallery images and groups them by colorway via alt text', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.images).toHaveLength(3)
    expect(p.shop?.imagesByColorName['Black']).toHaveLength(2)
    // 'Bone' isn't one of this product's colorways, so it isn't grouped.
    expect(p.shop?.imagesByColorName['Bone']).toBeUndefined()
  })

  it('maps the Shopify variant GID per colorway and size', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.shop?.variantIdByColorAndSize?.['Black']?.['M']).toBe(
      'gid://shopify/ProductVariant/1',
    )
  })

  it('productMatchesDropId checks dropIds array', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(productMatchesDropId(p, 'drop-oath-01')).toBe(true)
    expect(productMatchesDropId(p, 'other')).toBe(false)
  })
})
