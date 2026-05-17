import { describe, expect, it } from 'vitest'
import type { Product } from '@/features/products/types/product.types'
import {
  catalogPriceBounds,
  defaultShopUrlSearch,
  filterShopListingProducts,
  uniqueColorwayNames,
  uniqueSizeLabels,
  validateShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'

function makeProduct(overrides: Partial<Product>): Product {
  const base: Product = {
    id: 'p-1',
    slug: 'p-1',
    name: 'Product',
    dropName: 'The Oath',
    role: 'tee',
    fit: 'oversized',
    fabric: 'cotton',
    gsm: '240',
    storytelling: 'Built for forge work.',
    designDetails: [],
    careInstructions: [],
    colorways: [{ name: 'Bone', base: '#0B0B0C', accent: '#E7E4DF' }],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 79,
    images: [],
  }
  return { ...base, ...overrides }
}

describe('validateShopUrlSearch', () => {
  it('returns sensible defaults for an empty record', () => {
    expect(validateShopUrlSearch({})).toEqual(defaultShopUrlSearch)
  })

  it('normalizes unknown source values to "all"', () => {
    expect(validateShopUrlSearch({ source: 'pirate' }).source).toBe('all')
    expect(validateShopUrlSearch({ source: 'drop' }).source).toBe('drop')
    expect(validateShopUrlSearch({ source: 'individual' }).source).toBe(
      'individual',
    )
  })

  it('rejects negative or non-numeric prices', () => {
    expect(validateShopUrlSearch({ minPrice: -5 }).minPrice).toBeUndefined()
    expect(validateShopUrlSearch({ maxPrice: 'free' }).maxPrice).toBeUndefined()
    expect(validateShopUrlSearch({ minPrice: '79' }).minPrice).toBe(79)
  })
})

describe('filterShopListingProducts', () => {
  const items: Product[] = [
    makeProduct({ id: 'a', name: 'Forge Tee', price: 79, dropName: 'The Oath' }),
    makeProduct({
      id: 'b',
      name: 'Stringer',
      price: 65,
      dropName: 'The Oath',
      colorways: [{ name: 'Steel', base: '#1D1F21', accent: '#34373A' }],
    }),
    makeProduct({
      id: 'c',
      name: 'Compression Tee',
      price: 95,
      dropName: 'Solo Release',
    }),
  ]

  it('matches by query against product name', () => {
    const r = filterShopListingProducts(items, {
      ...defaultShopUrlSearch,
      q: 'compression',
    })
    expect(r.map((p) => p.id)).toEqual(['c'])
  })

  it('respects min/max price bounds', () => {
    const r = filterShopListingProducts(items, {
      ...defaultShopUrlSearch,
      minPrice: 70,
      maxPrice: 90,
    })
    expect(r.map((p) => p.id)).toEqual(['a'])
  })

  it('respects color filter by colorway name', () => {
    const r = filterShopListingProducts(items, {
      ...defaultShopUrlSearch,
      color: 'Steel',
    })
    expect(r.map((p) => p.id)).toEqual(['b'])
  })

  it('returns everything when no filter is set', () => {
    const r = filterShopListingProducts(items, defaultShopUrlSearch)
    expect(r.length).toBe(items.length)
  })
})

describe('catalog aggregations', () => {
  const items: Product[] = [
    makeProduct({ id: 'a', price: 50, sizes: ['S', 'M'] }),
    makeProduct({
      id: 'b',
      price: 110,
      sizes: ['M', 'L'],
      colorways: [{ name: 'Steel', base: '#1D1F21', accent: '#34373A' }],
    }),
  ]

  it('catalogPriceBounds returns [0,0] for an empty catalog', () => {
    expect(catalogPriceBounds([])).toEqual({ min: 0, max: 0 })
  })

  it('catalogPriceBounds returns min and max across items', () => {
    expect(catalogPriceBounds(items)).toEqual({ min: 50, max: 110 })
  })

  it('uniqueColorwayNames is sorted and de-duplicated', () => {
    expect(uniqueColorwayNames(items)).toEqual(['Bone', 'Steel'])
  })

  it('uniqueSizeLabels follows the canonical size order', () => {
    expect(uniqueSizeLabels(items)).toEqual(['S', 'M', 'L'])
  })
})
