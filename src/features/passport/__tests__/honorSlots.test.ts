import { describe, expect, it } from 'vitest'
import {
  buildHonorSlots,
  isHonorFull,
  nextFreeHonorSlot,
} from '@/features/storefront-account/account/panels/armory/honorSlots'
import type { ArmoryCatalogEntry } from '@/features/passport/lib/armory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

const catalog: ArmoryCatalogEntry[] = [
  { slug: 'tee', name: 'Tee', dropName: 'The Oath', image: 'tee.png' },
  { slug: 'shorts', name: 'Shorts', dropName: 'The Oath', image: 'sh.png' },
]

function piece(slug: string, featuredSlot: 1 | 2 | 3 | null, id = slug): OwnedPassport {
  return {
    id,
    token: `t-${id}`,
    productSlug: slug,
    productName: slug,
    serialNumber: 1,
    editionTotal: 100,
    claimedAt: '2026-07-10T10:00:00Z',
    claimedColor: null,
    claimedSize: null,
    wearCount: 0,
    lastWornAt: null,
    featuredSlot,
    isPublic: false,
  }
}

describe('buildHonorSlots', () => {
  it('always returns three slots in order, filled where pinned', () => {
    const slots = buildHonorSlots([piece('tee', 1), piece('shorts', 3)], catalog)
    expect(slots.map((s) => s.slot)).toEqual([1, 2, 3])
    expect(slots[0]!.passport?.productSlug).toBe('tee')
    expect(slots[0]!.image).toBe('tee.png')
    expect(slots[1]!.passport).toBeNull() // slot 2 empty pedestal
    expect(slots[2]!.passport?.productSlug).toBe('shorts')
  })

  it('leaves all three empty for an unpinned armory', () => {
    const slots = buildHonorSlots([piece('tee', null)], catalog)
    expect(slots.every((s) => s.passport === null)).toBe(true)
  })
})

describe('nextFreeHonorSlot', () => {
  it('finds the lowest open slot', () => {
    expect(nextFreeHonorSlot([piece('tee', 1)])).toBe(2)
    expect(nextFreeHonorSlot([piece('tee', 1), piece('shorts', 2, 'b')])).toBe(3)
  })

  it('returns null when the shrine is full', () => {
    const full = [piece('a', 1, 'a'), piece('b', 2, 'b'), piece('c', 3, 'c')]
    expect(nextFreeHonorSlot(full)).toBeNull()
    expect(isHonorFull(full)).toBe(true)
  })
})
