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

  it('clamps progress to the target and never exceeds 1', () => {
    const ctx: ChallengeContext = { ...empty, registrations: 9 }
    const loadout = evaluateChallenges(ctx).find((c) => c.id === 'full-loadout')!
    expect(loadout.current).toBe(3) // clamped from 9
    expect(loadout.progress).toBe(1)
    expect(loadout.complete).toBe(true)
  })

  it('orders incomplete-nearest-first, completed last', () => {
    const ctx: ChallengeContext = { ...empty, registrations: 1, totalWears: 20 }
    const result = evaluateChallenges(ctx)
    // First-strike (1/1) is complete → must not be first.
    expect(result[0]!.complete).toBe(false)
    expect(result[result.length - 1]!.complete).toBe(true)
    // Battle-worn 20/25 (0.8) should lead the incomplete set over loadout 1/3.
    expect(result[0]!.id).toBe('battle-worn-1')
  })

  it('marks everything incomplete for a fresh armory', () => {
    const result = evaluateChallenges(empty)
    expect(result.every((c) => !c.complete)).toBe(true)
  })
})
