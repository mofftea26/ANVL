import { describe, expect, it } from 'vitest'
import {
  buildCollectionDrops,
  buildTimeline,
  buildVaultDrops,
  type ArmoryCatalogEntry,
} from '@/features/passport/lib/armory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

const catalog: ArmoryCatalogEntry[] = [
  { slug: 'oversized-tee', name: 'Oversized Tee', dropName: 'The Oath', image: 'tee.png', category: 'Tops' },
  { slug: 'compression-tee', name: 'Compression Tee', dropName: 'The Oath', image: 'comp.png', category: 'Tops' },
  { slug: 'stringer', name: 'Stringer', dropName: 'The Oath', image: 'str.png', category: 'Tops' },
  { slug: 'forged-shorts', name: 'Forged Shorts', dropName: 'The Oath', image: 'sh.png', category: 'Bottoms' },
  { slug: 'future-hoodie', name: 'Future Hoodie', dropName: 'Drop 02', image: 'hd.png' },
]

function passport(slug: string, claimedAt: string | null, id = slug): OwnedPassport {
  return {
    id,
    token: `token-${id}`,
    productSlug: slug,
    productName: slug,
    serialNumber: 1,
    editionTotal: 100,
    claimedAt,
    claimedColor: 'Onyx',
    claimedSize: 'M',
    wearCount: 0,
    lastWornAt: null,
    featuredSlot: null,
    isPublic: false,
  }
}

const owned: OwnedPassport[] = [
  passport('oversized-tee', '2026-07-01T10:00:00Z'),
  passport('forged-shorts', '2026-07-10T10:00:00Z'),
]

describe('buildVaultDrops', () => {
  it('shows only STARTED drops, with every piece of them as lit or empty slots', () => {
    const drops = buildVaultDrops(owned, catalog)
    // Drop 02 is untouched → the vault never advertises it.
    expect(drops.map((d) => d.dropName)).toEqual(['The Oath'])
    const oath = drops[0]!
    expect(oath.total).toBe(4)
    expect(oath.owned).toBe(2)
    expect(oath.slots.filter((s) => s.passport === null).map((s) => s.name)).toEqual([
      'Compression Tee',
      'Stringer',
    ])
    expect(oath.slots[0]!.image).toBe('tee.png')
  })

  it('is empty for a fresh account', () => {
    expect(buildVaultDrops([], catalog)).toEqual([])
  })

  it('collapses duplicate units of the same product into one slot', () => {
    const drops = buildVaultDrops(
      [passport('stringer', '2026-07-01T10:00:00Z', 'a'), passport('stringer', '2026-07-05T10:00:00Z', 'b')],
      catalog,
    )
    expect(drops[0]!.owned).toBe(1)
    // The newest registration fills the slot.
    expect(drops[0]!.slots.find((s) => s.slug === 'stringer')!.passport!.id).toBe('b')
  })
})

describe('buildCollectionDrops', () => {
  it('covers EVERY drop — owned and missing split out', () => {
    const drops = buildCollectionDrops(owned, catalog)
    expect(drops.map((d) => d.dropName)).toEqual(['The Oath', 'Drop 02'])
    expect(drops[0]!.owned.map((s) => s.slug)).toEqual(['oversized-tee', 'forged-shorts'])
    expect(drops[0]!.missing).toHaveLength(2)
    expect(drops[0]!.total).toBe(4)
    // Untouched drop still listed, fully missing.
    expect(drops[1]!.owned).toEqual([])
    expect(drops[1]!.missing).toHaveLength(1)
  })

  it('ignores catalog entries with no drop', () => {
    const drops = buildCollectionDrops([], [{ slug: 'x', name: 'X', dropName: '' }])
    expect(drops).toEqual([])
  })
})

describe('buildTimeline', () => {
  it('lists every unit newest-first with its drop', () => {
    const entries = buildTimeline(owned, catalog)
    expect(entries.map((e) => e.passport.productSlug)).toEqual(['forged-shorts', 'oversized-tee'])
    expect(entries[0]!.dropName).toBe('The Oath')
    expect(entries[0]!.date?.toISOString()).toBe('2026-07-10T10:00:00.000Z')
  })

  it('keeps duplicates (a timeline is a record of units, not products)', () => {
    const entries = buildTimeline(
      [passport('stringer', '2026-07-01T10:00:00Z', 'a'), passport('stringer', '2026-07-05T10:00:00Z', 'b')],
      catalog,
    )
    expect(entries).toHaveLength(2)
  })

  it('tolerates missing/bogus dates and unknown products', () => {
    const entries = buildTimeline(
      [passport('gone-from-catalog', null, 'x'), passport('oversized-tee', 'not-a-date', 'y')],
      catalog,
    )
    expect(entries.every((e) => e.date === null)).toBe(true)
    expect(entries.find((e) => e.passport.id === 'x')!.dropName).toBe('')
  })
})

