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
  productType: 'Tees',
  tags: ['fit:oversized', 'drop-01'],
  createdAt: '2026-06-01T12:00:00Z',
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
          compareAtPrice: { amount: '69.00', currencyCode: 'USD' },
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

  it('maps productType to shop.category, falling back to Apparel', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.shop?.category).toBe('Tees')

    const noType = { ...sampleNode, productType: '' }
    const q = mapShopifyProductNodeToStorefront(
      noType as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(q.shop?.category).toBe('Apparel')
  })

  it('parses the fit facet from a fit: tag (case-insensitive, title-cased)', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.shop?.fit).toBe('Oversized')

    const upper = { ...sampleNode, tags: ['FIT:Compression'] }
    expect(
      mapShopifyProductNodeToStorefront(
        upper as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
      ).shop?.fit,
    ).toBe('Compression')

    const none = { ...sampleNode, tags: ['drop-01'] }
    expect(
      mapShopifyProductNodeToStorefront(
        none as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
      ).shop?.fit,
    ).toBeUndefined()
  })

  it('carries tags and createdAt for search + newest sort', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.shop?.tags).toEqual(['fit:oversized', 'drop-01'])
    expect(p.shop?.createdAt).toBe('2026-06-01T12:00:00Z')
  })

  it('emits compareAtPrice and marks the product on sale', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.shop?.compareAtPrice).toBe(69)
    expect(p.shop?.storefrontStatus).toBe('sale')
  })

  it('ignores compare-at prices at or below the display price', () => {
    const notReallyOnSale = {
      ...sampleNode,
      variants: {
        edges: [
          {
            node: {
              ...sampleNode.variants.edges[0]!.node,
              compareAtPrice: { amount: '49.00', currencyCode: 'USD' },
            },
          },
        ],
      },
    }
    const p = mapShopifyProductNodeToStorefront(
      notReallyOnSale as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.shop?.compareAtPrice).toBeNull()
    expect(p.shop?.storefrontStatus).toBe('available')
  })

  it('keeps outOfStock precedence over sale', () => {
    const soldOut = {
      ...sampleNode,
      variants: {
        edges: [
          {
            node: {
              ...sampleNode.variants.edges[0]!.node,
              availableForSale: false,
            },
          },
        ],
      },
    }
    const p = mapShopifyProductNodeToStorefront(
      soldOut as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(p.shop?.storefrontStatus).toBe('outOfStock')
  })

  it('productMatchesDropId checks dropIds array', () => {
    const p = mapShopifyProductNodeToStorefront(
      sampleNode as Parameters<typeof mapShopifyProductNodeToStorefront>[0],
    )
    expect(productMatchesDropId(p, 'drop-oath-01')).toBe(true)
    expect(productMatchesDropId(p, 'other')).toBe(false)
  })
})
