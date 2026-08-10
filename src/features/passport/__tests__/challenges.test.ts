import { describe, expect, it } from 'vitest'
import {
  buildChallengeContext,
  evaluateChallenges,
  type ChallengeContext,
} from '@/features/passport/lib/challenges'
import type { DropCompletion } from '@/features/passport/lib/ranks'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

function piece(wearCount: number, featuredSlot: 1 | 2 | 3 | null, id = String(Math.random())): OwnedPassport {
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
    featuredSlot,
    isPublic: false,
  }
}

describe('buildChallengeContext', () => {
  it('derives the counters challenges read', () => {
    const completion: DropCompletion[] = [{ dropName: 'The Oath', claimed: 2, total: 2 }]
    const ctx = buildChallengeContext({
      owned: [piece(10, 1, 'a'), piece(22, null, 'b')],
      featCount: 3,
      completion,
    })
    expect(ctx.registrations).toBe(2)
    expect(ctx.totalWears).toBe(32)
    expect(ctx.maxWears).toBe(22)
    expect(ctx.featCount).toBe(3)
    expect(ctx.fullDrops).toBe(1)
    expect(ctx.honorPinned).toBe(1)
  })
})

describe('evaluateChallenges', () => {
  const empty: ChallengeContext = {
    registrations: 0,
    totalWears: 0,
    maxWears: 0,
    featCount: 0,
    fullDrops: 0,
    honorPinned: 0,
  }

  /**
   * Progress never exceeds its target. With tier families this is asserted on
   * whichever tier is CURRENTLY being chased rather than a fixed key: at 9
   * registrations the claims family has already advanced past Full Loadout, so
   * looking that key up by name would find nothing.
   */
  it('clamps progress to the target and never exceeds 1', () => {
    const ctx: ChallengeContext = { ...empty, registrations: 9 }
    const rows = evaluateChallenges(ctx)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.current).toBeLessThanOrEqual(row.target)
      expect(row.progress).toBeLessThanOrEqual(1)
      expect(row.progress).toBeGreaterThanOrEqual(0)
    }

    // 9 registrations clears every claims tier the offline defaults carry, so
    // the family reports as finished and stands on its highest tier, clamped
    // to that tier's target rather than showing the raw 9.
    const claims = rows.find((r) => r.id.startsWith('the-armory'))!
    expect(claims.familyComplete).toBe(true)
    expect(claims.complete).toBe(true)
    expect(claims.current).toBe(claims.target)
    expect(claims.tier).toBeGreaterThan(1)
  })

  it('orders incomplete-nearest-first, completed last', () => {
    const ctx: ChallengeContext = { ...empty, registrations: 1, totalWears: 20 }
    const result = evaluateChallenges(ctx)

    // Battle-Worn I at 20/25 (0.8) leads the claims family at 1/3 (0.33).
    expect(result[0]!.complete).toBe(false)
    expect(result[0]!.id).toBe('battle-worn-1')

    // Ordering invariant: no incomplete row may follow a complete one.
    const firstComplete = result.findIndex((r) => r.complete)
    if (firstComplete !== -1) {
      expect(result.slice(firstComplete).every((r) => r.complete)).toBe(true)
    }
  })

  it('marks everything incomplete for a fresh armory', () => {
    const result = evaluateChallenges(empty)
    expect(result.every((c) => !c.complete)).toBe(true)
  })
})
