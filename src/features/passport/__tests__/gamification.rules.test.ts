import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GAMIFICATION_RULES,
  GAMIFICATION_METRICS,
} from '../schemas/gamification.schema'
import { CHALLENGE_METRIC_ACCESSORS, evaluateChallenges } from '../lib/challenges'
import { computeForgeLevel, cumulativeXpForLevel } from '../lib/forgeXp'
import { deriveArmoryRank, type DropCompletion } from '../lib/ranks'

/**
 * Rank-derivation contract for the XP-driven ladder.
 *
 * This suite previously pinned the declarative resolver against a hardcoded
 * copy of the ORIGINAL four-rank, registration-gated ladder. That oracle is
 * deliberately gone: gamification v2 replaced it with an eight-rank XP ladder,
 * so an equivalence test against the old shape would now be asserting that the
 * feature was never built.
 */
function completionWithFullDrops(count: number): DropCompletion[] {
  return Array.from({ length: count }, (_, i) => ({
    dropName: `Drop ${i + 1}`,
    claimed: 3,
    total: 3,
  }))
}

describe('declarative rank derivation', () => {
  const R = DEFAULT_GAMIFICATION_RULES

  it('is monotonic: more XP never demotes you', () => {
    let lastIndex = -1
    for (let xp = 0; xp <= 90_000; xp += 250) {
      const rank = deriveArmoryRank(0, [], R, xp)
      const index = R.ranks.findIndex((r) => r.key === rank.key)
      expect(index, `xp=${xp} derived ${rank.key}`).toBeGreaterThanOrEqual(lastIndex)
      lastIndex = index
    }
  })

  /**
   * With zero XP, only levels carrying no XP gate can match — and the seed
   * floor is the only one. Counts alone must never lift anyone off it, which
   * is the property that broke when the XP gate was skippable.
   */
  it('holds the floor at zero XP for every claims × fullDrops combination', () => {
    for (let claims = 0; claims <= 15; claims += 1) {
      for (let fullDrops = 0; fullDrops <= 3; fullDrops += 1) {
        const rank = deriveArmoryRank(claims, completionWithFullDrops(fullDrops), R, 0)
        expect(rank.key, `claims=${claims} fullDrops=${fullDrops}`).toBe('unsworn')
      }
    }
  })

  it('keeps the code-owned emblem fallback', () => {
    expect(deriveArmoryRank(1, [], R, 100).emblemSrc).toBe('/brand/ranks/initiate.png')
  })

  it('honors a CMS emblem override', () => {
    const rules = structuredClone(DEFAULT_GAMIFICATION_RULES)
    rules.ranks.find((r) => r.key === 'initiate')!.emblemUrl =
      'https://cdn.example/initiate-custom.png'
    expect(deriveArmoryRank(1, [], rules, 100).emblemSrc).toBe(
      'https://cdn.example/initiate-custom.png',
    )
  })

  it('respects edited thresholds', () => {
    const rules = structuredClone(DEFAULT_GAMIFICATION_RULES)
    rules.ranks.find((r) => r.key === 'forged')!.levels[0]!.minXp = 200
    expect(deriveArmoryRank(0, [], rules, 200)).toMatchObject({ key: 'forged', level: 1 })
  })
})

describe('challenge metric vocabulary', () => {
  it('covers every declared metric', () => {
    for (const metric of GAMIFICATION_METRICS) {
      expect(CHALLENGE_METRIC_ACCESSORS[metric]).toBeTypeOf('function')
    }
  })

  it('skips inactive challenges', () => {
    const rules = structuredClone(DEFAULT_GAMIFICATION_RULES)
    rules.challenges = rules.challenges.map((c) =>
      c.key === 'loadout' ? { ...c, isActive: false } : c,
    )
    const ctx = {
      registrations: 3,
      totalWears: 0,
      maxWears: 0,
      featCount: 0,
      fullDrops: 0,
      honorPinned: 0,
    }
    const ids = evaluateChallenges(ctx, rules).map((c) => c.id)
    expect(ids).not.toContain('loadout')
    expect(ids).toContain('first-strike')
  })
})

describe('forge XP settings', () => {
  it('level curve honors a custom factor', () => {
    expect(cumulativeXpForLevel(2)).toBe(150)
    expect(cumulativeXpForLevel(2, 100)).toBe(200)
  })

  it('breakdown scales with edited XP constants', () => {
    const settings = { ...DEFAULT_GAMIFICATION_RULES.settings, xpPerRegistration: 10 }
    const owned = [
      { wearCount: 0, productSlug: 'a' },
      { wearCount: 0, productSlug: 'b' },
      // Only the fields the XP math reads are needed for this check.
    ] as unknown as Parameters<typeof computeForgeLevel>[0]['owned']
    const forge = computeForgeLevel({ owned, featCount: 0, completion: [] }, settings)
    expect(forge.breakdown.registrations).toBe(20)
  })
})
