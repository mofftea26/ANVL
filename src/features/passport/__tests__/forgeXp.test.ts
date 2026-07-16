import { describe, expect, it } from 'vitest'
import {
  computeForgeLevel,
  computeForgeXpBreakdown,
  cumulativeXpForLevel,
  nextForgeMilestone,
  XP_PER_FULL_DROP,
  XP_PER_REGISTRATION,
} from '@/features/passport/lib/forgeXp'
import type { DropCompletion } from '@/features/passport/lib/ranks'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

function piece(wearCount: number, id = String(Math.random())): OwnedPassport {
  return {
    id,
    token: `t-${id}`,
    productSlug: id,
    productName: id,
    serialNumber: 1,
    editionTotal: 100,
    claimedAt: null,
    claimedColor: null,
    claimedSize: null,
    wearCount,
    lastWornAt: null,
    featuredSlot: null,
    isPublic: false,
  }
}

describe('computeForgeXpBreakdown', () => {
  it('sums XP from registrations, wears, feats and full drops', () => {
    const completion: DropCompletion[] = [{ dropName: 'The Oath', claimed: 2, total: 2 }]
    const b = computeForgeXpBreakdown({
      owned: [piece(3, 'a'), piece(2, 'b')],
      featCount: 2,
      completion,
    })
    expect(b.registrations).toBe(2 * XP_PER_REGISTRATION) // 200
    expect(b.wears).toBe((3 + 2) * 5) // 25
    expect(b.feats).toBe(2 * 20) // 40
    expect(b.fullDrops).toBe(XP_PER_FULL_DROP) // 200
    expect(b.total).toBe(200 + 25 + 40 + 200)
  })
})

describe('cumulativeXpForLevel', () => {
  it('is a rising quadratic, level 1 at zero', () => {
    expect(cumulativeXpForLevel(1)).toBe(0)
    expect(cumulativeXpForLevel(2)).toBe(150)
    expect(cumulativeXpForLevel(3)).toBe(450)
    expect(cumulativeXpForLevel(3)).toBeGreaterThan(cumulativeXpForLevel(2))
  })
})

describe('computeForgeLevel', () => {
  it('starts at level 1 for an empty armory', () => {
    const forge = computeForgeLevel({ owned: [], featCount: 0, completion: [] })
    expect(forge.level).toBe(1)
    expect(forge.total).toBe(0)
    expect(forge.progress).toBe(0)
  })

  it('places total XP into the right level with progress toward the next', () => {
    // 2 registrations = 200 XP → past level 2 (150), short of level 3 (450).
    const forge = computeForgeLevel({ owned: [piece(0, 'a'), piece(0, 'b')], featCount: 0, completion: [] })
    expect(forge.level).toBe(2)
    expect(forge.xpIntoLevel).toBe(50) // 200 - 150
    expect(forge.xpForLevel).toBe(300) // 450 - 150
    expect(forge.xpToNext).toBe(250) // 450 - 200
    expect(forge.progress).toBeCloseTo(50 / 300)
  })
})

describe('nextForgeMilestone', () => {
  it('points at the next rank when a registration would change it', () => {
    // 2 registrations → Initiate III; one more → Forged I.
    const owned = [piece(0, 'a'), piece(0, 'b')]
    const forge = computeForgeLevel({ owned, featCount: 0, completion: [] })
    const milestone = nextForgeMilestone({ claimCount: 2, completion: [], forge })
    expect(milestone.label).toBe('Forged I')
    expect(milestone.detail).toMatch(/1 more piece/)
  })

  it('falls back to the next Forge Level when no rank change is near', () => {
    // 10 registrations → Oathbound III (top of the count ladder without a full
    // drop); +4 more won't change the title, so it points at the Forge Level.
    const owned = Array.from({ length: 10 }, (_, i) => piece(0, `p${i}`))
    const forge = computeForgeLevel({ owned, featCount: 0, completion: [] })
    const milestone = nextForgeMilestone({ claimCount: 10, completion: [], forge })
    expect(milestone.label).toMatch(/Forge Level/)
    expect(milestone.detail).toMatch(/XP to go/)
  })
})
