import { describe, expect, it } from 'vitest'
import {
  buildPassportRelated,
  isDropComplete,
  unregistered,
  type RelatedCatalogEntry,
} from '@/features/passport/lib/relatedProducts'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

const catalog: RelatedCatalogEntry[] = [
  { slug: 'oversized-tee', name: 'Oversized Tee', dropName: 'The Oath', category: 'Tops', image: 'tee.png' },
  { slug: 'compression-tee', name: 'Compression Tee', dropName: 'The Oath', category: 'Tops', image: 'comp.png' },
  { slug: 'stringer', name: 'Stringer', dropName: 'The Oath', category: 'Tops', image: 'str.png' },
  { slug: 'forged-shorts', name: 'Forged Shorts', dropName: 'The Oath', category: 'Bottoms', image: 'sh.png' },
  { slug: 'future-cap', name: 'Future Cap', dropName: 'Drop 02', category: 'Headwear' },
]

function owns(...slugs: string[]): OwnedPassport[] {
  return slugs.map((slug, i) => ({
    id: `p${i}`,
    token: `t${i}`,
    productSlug: slug,
    productName: slug,
    serialNumber: 1,
    editionTotal: 100,
    claimedAt: '2026-07-10T10:00:00Z',
    claimedColor: null,
    claimedSize: null,
    wearCount: 0,
    lastWornAt: null,
    featuredSlot: null,
    isPublic: false,
  }))
}

describe('buildPassportRelated', () => {
  it('collects drop-mates and category-mates, excluding the piece itself', () => {
    const related = buildPassportRelated({
      productSlug: 'oversized-tee',
      dropName: 'The Oath',
      category: 'Tops',
      catalog,
    })
    expect(related.dropMates.map((r) => r.slug)).toEqual([
      'compression-tee',
      'stringer',
      'forged-shorts',
    ])
    // Same category, still excluding itself + the different-category shorts.
    expect(related.categoryMates.map((r) => r.slug)).toEqual(['compression-tee', 'stringer'])
    expect(related.dropMates[0]!.image).toBe('comp.png')
  })

  it('is case-insensitive on category', () => {
    const related = buildPassportRelated({
      productSlug: 'oversized-tee',
      dropName: 'The Oath',
      category: 'TOPS',
      catalog,
    })
    expect(related.categoryMates.map((r) => r.slug)).toEqual(['compression-tee', 'stringer'])
  })

  it('returns empty groups when the piece has no drop/category', () => {
    const related = buildPassportRelated({
      productSlug: 'oversized-tee',
      dropName: '',
      category: undefined,
      catalog,
    })
    expect(related.dropMates).toEqual([])
    expect(related.categoryMates).toEqual([])
  })
})

describe('unregistered', () => {
  it('removes pieces the owner already holds', () => {
    const related = buildPassportRelated({
      productSlug: 'oversized-tee',
      dropName: 'The Oath',
      category: 'Tops',
      catalog,
    })
    const missing = unregistered(related.dropMates, owns('compression-tee'))
    expect(missing.map((r) => r.slug)).toEqual(['stringer', 'forged-shorts'])
  })
})

describe('isDropComplete', () => {
  const related = buildPassportRelated({
    productSlug: 'oversized-tee',
    dropName: 'The Oath',
    category: 'Tops',
    catalog,
  })

  it('is true only when every OTHER drop piece is registered', () => {
    expect(isDropComplete(related, owns('compression-tee', 'stringer', 'forged-shorts'))).toBe(
      true,
    )
    expect(isDropComplete(related, owns('compression-tee'))).toBe(false)
  })

  it('is false for a drop with no other pieces (nothing to complete)', () => {
    const solo = buildPassportRelated({
      productSlug: 'future-cap',
      dropName: 'Drop 02',
      category: 'Headwear',
      catalog,
    })
    expect(solo.dropMates).toEqual([])
    expect(isDropComplete(solo, [])).toBe(false)
  })
})
