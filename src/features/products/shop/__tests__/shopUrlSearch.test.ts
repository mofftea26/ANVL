import { describe, expect, it } from 'vitest'
import type { Product } from '@/features/products/types/product.types'
import {
  catalogPriceBounds,
  computeShopFacetCounts,
  defaultShopUrlSearch,
  filterShopListingProducts,
  sortShopListingProducts,
  uniqueCategories,
  uniqueColorwayNames,
  uniqueColorwaySwatches,
  uniqueFitLabels,
  uniqueSizeLabels,
  validateShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import type { ProductShopMeta } from '@/features/products/types/product.types'

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

  it('carries the fit param through, defaulting to empty', () => {
    expect(validateShopUrlSearch({}).fit).toBe('')
    expect(validateShopUrlSearch({ fit: 'Oversized' }).fit).toBe('Oversized')
    expect(validateShopUrlSearch({ fit: 42 }).fit).toBe('')
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

describe('category filtering + facets', () => {
  const items: Product[] = [
    makeProduct({ id: 'a', shop: shopMeta({ category: 'Tops' }) }),
    makeProduct({ id: 'b', shop: shopMeta({ category: 'Bottoms' }) }),
    makeProduct({ id: 'c', shop: shopMeta({ category: 'Tops' }) }),
  ]

  it('filters by category (case-insensitive)', () => {
    const r = filterShopListingProducts(items, {
      ...defaultShopUrlSearch,
      category: 'tops',
    })
    expect(r.map((p) => p.id)).toEqual(['a', 'c'])
  })

  it('uniqueCategories is sorted + de-duplicated', () => {
    expect(uniqueCategories(items)).toEqual(['Bottoms', 'Tops'])
  })
})

describe('fit facet', () => {
  const items: Product[] = [
    makeProduct({ id: 'a', shop: shopMeta({ fit: 'Oversized' }) }),
    makeProduct({ id: 'b', shop: shopMeta({ fit: 'Compression' }) }),
    makeProduct({ id: 'c', shop: shopMeta({ fit: 'Oversized' }) }),
    makeProduct({ id: 'd' }), // no shop meta → no fit
  ]

  it('filters by fit label (case-insensitive) — URL round-trip', () => {
    const search = validateShopUrlSearch({ fit: 'oversized' })
    const r = filterShopListingProducts(items, search)
    expect(r.map((p) => p.id)).toEqual(['a', 'c'])
  })

  it('uniqueFitLabels is sorted + de-duplicated', () => {
    expect(uniqueFitLabels(items)).toEqual(['Compression', 'Oversized'])
  })

  it('counts the fit facet while holding other filters', () => {
    const counts = computeShopFacetCounts(items, defaultShopUrlSearch)
    expect(counts.fit).toEqual({ Oversized: 2, Compression: 1 })
  })

  it('matches fit and tags text in the free-text search', () => {
    const tagged: Product[] = [
      makeProduct({
        id: 'tagged',
        name: 'Plain Piece',
        storytelling: '',
        role: '',
        shop: shopMeta({ tags: ['limited-run'] }),
      }),
    ]
    const r = filterShopListingProducts(tagged, {
      ...defaultShopUrlSearch,
      q: 'limited-run',
    })
    expect(r.map((p) => p.id)).toEqual(['tagged'])
  })
})

describe('uniqueColorwaySwatches', () => {
  it('returns the first-seen swatch per name, sorted', () => {
    const items: Product[] = [
      makeProduct({ id: 'a', colorways: [{ name: 'Steel', base: '#111', accent: '#222' }] }),
      makeProduct({ id: 'b', colorways: [{ name: 'Bone', base: '#eee', accent: '#ddd' }] }),
      makeProduct({ id: 'c', colorways: [{ name: 'Steel', base: '#999', accent: '#888' }] }),
    ]
    expect(uniqueColorwaySwatches(items)).toEqual([
      { name: 'Bone', base: '#eee', accent: '#ddd' },
      { name: 'Steel', base: '#111', accent: '#222' },
    ])
  })
})

describe('computeShopFacetCounts', () => {
  const items: Product[] = [
    makeProduct({
      id: 'a',
      colorways: [{ name: 'Steel', base: '#111', accent: '#222' }],
      shop: shopMeta({ category: 'Tops', storefrontStatus: 'available' }),
    }),
    makeProduct({
      id: 'b',
      colorways: [{ name: 'Bone', base: '#eee', accent: '#ddd' }],
      shop: shopMeta({ category: 'Tops', storefrontStatus: 'outOfStock' }),
    }),
    makeProduct({
      id: 'c',
      colorways: [{ name: 'Steel', base: '#111', accent: '#222' }],
      shop: shopMeta({ category: 'Bottoms', storefrontStatus: 'available' }),
    }),
  ]

  it('counts each dimension while holding the other active filters', () => {
    const counts = computeShopFacetCounts(items, defaultShopUrlSearch)
    expect(counts.category).toEqual({ Tops: 2, Bottoms: 1 })
    expect(counts.status).toEqual({ available: 2, outOfStock: 1 })
    expect(counts.color).toEqual({ Steel: 2, Bone: 1 })
  })

  it('reflects an active filter from a different dimension (faceting)', () => {
    // With category=Bottoms active, the colorway counts should only reflect
    // Bottoms products — Steel: 1, Bone: 0.
    const counts = computeShopFacetCounts(items, {
      ...defaultShopUrlSearch,
      category: 'Bottoms',
    })
    expect(counts.color.Steel).toBe(1)
    expect(counts.color.Bone ?? 0).toBe(0)
  })
})

describe('sortShopListingProducts', () => {
  const items: Product[] = [
    makeProduct({ id: 'a', name: 'Alpha', price: 80 }),
    makeProduct({
      id: 'b',
      name: 'Bravo',
      price: 50,
      shop: shopMeta({ storefrontStatus: 'outOfStock' }),
    }),
    makeProduct({ id: 'c', name: 'Charlie', price: 65 }),
  ]

  it('featured preserves the curated order', () => {
    expect(sortShopListingProducts(items, 'featured').map((p) => p.id)).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('price-asc sorts ascending without mutating the source', () => {
    const r = sortShopListingProducts(items, 'price-asc')
    expect(r.map((p) => p.id)).toEqual(['b', 'c', 'a'])
    expect(items.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('newest reverses the curated order when no timestamps exist', () => {
    expect(sortShopListingProducts(items, 'newest').map((p) => p.id)).toEqual([
      'c',
      'b',
      'a',
    ])
  })

  it('newest sorts by shop.createdAt when available (undated last)', () => {
    const dated: Product[] = [
      makeProduct({ id: 'old', shop: shopMeta({ createdAt: '2026-01-01T00:00:00Z' }) }),
      makeProduct({ id: 'undated' }),
      makeProduct({ id: 'new', shop: shopMeta({ createdAt: '2026-06-15T00:00:00Z' }) }),
    ]
    expect(sortShopListingProducts(dated, 'newest').map((p) => p.id)).toEqual([
      'new',
      'old',
      'undated',
    ])
  })

  it('availability puts purchasable pieces first, sold-out last', () => {
    expect(
      sortShopListingProducts(items, 'availability').map((p) => p.id),
    ).toEqual(['a', 'c', 'b'])
  })
})
