import { describe, expect, it } from 'vitest'
import { DEFAULT_PASSPORT_PRODUCT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import type { PassportContentConfig } from '@/features/cms/passportContent/passportContent.zod'
import {
  buildPassportSizeGuide,
  recommendSizes,
} from '@/features/passport/lib/sizeRecommendation'

/** A product whose sizes map straight through (M fits an M body). */
function trueToSize() {
  return {
    ...structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    fit: {
      ...DEFAULT_PASSPORT_PRODUCT_CONTENT.fit,
      sizeEquivalence: { S: 'S', M: 'M', L: 'L' },
    },
  }
}

/** An oversized cut: its M actually fits an S body. */
function runsBig() {
  return {
    ...structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    fit: {
      ...DEFAULT_PASSPORT_PRODUCT_CONTENT.fit,
      sizeEquivalence: { S: 'XS', M: 'S', L: 'M', XL: 'L' },
    },
  }
}

const catalog = [
  { slug: 'compression-tee', name: 'Compression Tee' },
  { slug: 'oversized-tee', name: 'Oversized Tee' },
  { slug: 'stringer', name: 'Stringer' },
]

const content: PassportContentConfig = {
  'compression-tee': trueToSize(),
  'oversized-tee': runsBig(),
  'stringer': trueToSize(),
}

describe('buildPassportSizeGuide', () => {
  it('maps this product and collects every other mapped product', () => {
    const guide = buildPassportSizeGuide({
      productSlug: 'compression-tee',
      passportContent: content,
      catalog,
    })
    expect(guide.canonicalBySize).toEqual({ s: 's', m: 'm', l: 'l' })
    expect(guide.others.map((o) => o.slug)).toEqual(['oversized-tee', 'stringer'])
    // Inverted: canonical → that product's size.
    expect(guide.others[0]!.sizeByCanonical).toEqual({ xs: 'S', s: 'M', m: 'L', l: 'XL' })
  })

  it('never includes the product itself', () => {
    const guide = buildPassportSizeGuide({
      productSlug: 'oversized-tee',
      passportContent: content,
      catalog,
    })
    expect(guide.others.some((o) => o.slug === 'oversized-tee')).toBe(false)
  })

  it('omits products the CMS has not mapped — no map, no guess', () => {
    const guide = buildPassportSizeGuide({
      productSlug: 'compression-tee',
      passportContent: { 'compression-tee': trueToSize() },
      catalog,
    })
    expect(guide.others).toEqual([])
  })
})

describe('recommendSizes', () => {
  const guide = buildPassportSizeGuide({
    productSlug: 'compression-tee',
    passportContent: content,
    catalog,
  })

  it('translates the registered size through the canonical map', () => {
    // M in the true-to-size Compression Tee = an M body → the oversized cut's
    // L, and the Stringer's M.
    expect(recommendSizes(guide, 'M')).toEqual([
      { slug: 'oversized-tee', name: 'Oversized Tee', size: 'L' },
      { slug: 'stringer', name: 'Stringer', size: 'M' },
    ])
  })

  it('is case-insensitive about the registered size', () => {
    expect(recommendSizes(guide, 'm')).toEqual(recommendSizes(guide, 'M'))
  })

  it('stays silent rather than guessing', () => {
    expect(recommendSizes(guide, null)).toEqual([])
    expect(recommendSizes(guide, '  ')).toEqual([])
    // A size this product never mapped.
    expect(recommendSizes(guide, 'XXL')).toEqual([])
    expect(recommendSizes(null, 'M')).toEqual([])
  })

  it('skips products that have no size for the viewer’s canonical', () => {
    const partial = buildPassportSizeGuide({
      productSlug: 'compression-tee',
      passportContent: {
        'compression-tee': trueToSize(),
        // Only stocks small canonicals.
        stringer: {
          ...structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
          fit: {
            ...DEFAULT_PASSPORT_PRODUCT_CONTENT.fit,
            sizeEquivalence: { S: 'XS' },
          },
        },
      },
      catalog,
    })
    // An M body has no Stringer size in that map → omitted entirely.
    expect(recommendSizes(partial, 'M')).toEqual([])
    expect(recommendSizes(partial, 'S')).toEqual([])
  })
})
