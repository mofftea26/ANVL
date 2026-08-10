import { describe, expect, it } from 'vitest'
import {
  computeForgeLevel,
  computeForgeXpBreakdown,
  cumulativeXpForLevel,
  nextForgeMilestone,
  XP_PER_FEAT,
  XP_PER_FULL_DROP,
  XP_PER_REGISTRATION,
  XP_PER_WEAR,
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
    // Expressed through the constants rather than literals: the XP economy is
    // CMS-tunable, so hardcoding the numbers made this suite fail every time
    // the rates were rebalanced without any behaviour actually regressing.
    expect(b.registrations).toBe(2 * XP_PER_REGISTRATION)
    expect(b.wears).toBe((3 + 2) * XP_PER_WEAR)
    expect(b.feats).toBe(2 * XP_PER_FEAT)
    expect(b.fullDrops).toBe(XP_PER_FULL_DROP)
    expect(b.total).toBe(
      2 * XP_PER_REGISTRATION + 5 * XP_PER_WEAR + 2 * XP_PER_FEAT + XP_PER_FULL_DROP,
    )
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
    const forge = computeForgeLevel({ owned: [piece(0, 'a'), piece(0, 'b')], featCount: 0, completion: [] })
    const total = 2 * XP_PER_REGISTRATION

    // Derived from the curve rather than asserted as literals, so a rebalanced
    // XP rate moves the expectation with it instead of failing the suite.
    const base = cumulativeXpForLevel(forge.level)
    const next = cumulativeXpForLevel(forge.level + 1)

    expect(forge.total).toBe(total)
    expect(base).toBeLessThanOrEqual(total)
    expect(next).toBeGreaterThan(total)
    expect(forge.xpIntoLevel).toBe(total - base)
    expect(forge.xpForLevel).toBe(next - base)
    expect(forge.xpToNext).toBe(next - total)
    expect(forge.progress).toBeCloseTo((total - base) / (next - base))
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
    // Sitting at the very top of the ladder: no number of extra pieces can
    // change the rank title, so the milestone must fall through to Forge Level.
    // Anvilborn III is XP-gated, and four more pieces cannot clear the gap to
    // anything beyond it because there is nothing beyond it.
    const owned = Array.from({ length: 400 }, (_, i) => piece(0, `p${i}`))
    const forge = computeForgeLevel({ owned, featCount: 0, completion: [] })
    const milestone = nextForgeMilestone({ claimCount: owned.length, completion: [], forge })
    expect(milestone.label).toMatch(/Forge Level/)
    expect(milestone.detail).toMatch(/XP to go/)
  })
})
