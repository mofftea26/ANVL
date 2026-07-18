import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GAMIFICATION_RULES,
  GAMIFICATION_METRICS,
} from '../schemas/gamification.schema'
import { CHALLENGE_METRIC_ACCESSORS, evaluateChallenges } from '../lib/challenges'
import { computeForgeLevel, cumulativeXpForLevel } from '../lib/forgeXp'
import { deriveArmoryRank, type DropCompletion } from '../lib/ranks'

/**
 * The historical hardcoded ladder, kept verbatim as the equivalence oracle:
 * the declarative resolver + DEFAULT_GAMIFICATION_RULES must reproduce it
 * exactly for every (claims, fullDrops) combination.
 */
function legacyRank(claimCount: number, fullDrops: number): { key: string; level: number } {
  if (fullDrops >= 2) return { key: 'warlord', level: 3 }
  if (fullDrops >= 1 && claimCount >= 12) return { key: 'warlord', level: 2 }
  if (fullDrops >= 1) return { key: 'warlord', level: 1 }
  if (claimCount >= 10) return { key: 'oathbound', level: 3 }
  if (claimCount >= 8) return { key: 'oathbound', level: 2 }
  if (claimCount >= 6) return { key: 'oathbound', level: 1 }
  if (claimCount >= 5) return { key: 'forged', level: 3 }
  if (claimCount >= 4) return { key: 'forged', level: 2 }
  if (claimCount >= 3) return { key: 'forged', level: 1 }
  if (claimCount >= 2) return { key: 'initiate', level: 3 }
  if (claimCount >= 1) return { key: 'initiate', level: 2 }
  return { key: 'initiate', level: 1 }
}

function completionWithFullDrops(count: number): DropCompletion[] {
  return Array.from({ length: count }, (_, i) => ({
    dropName: `Drop ${i + 1}`,
    claimed: 3,
    total: 3,
  }))
}

describe('declarative rank derivation ≡ legacy hardcoded ladder', () => {
  it('matches for every claims × fullDrops combination', () => {
    for (let claims = 0; claims <= 15; claims += 1) {
      for (let fullDrops = 0; fullDrops <= 3; fullDrops += 1) {
        const declarative = deriveArmoryRank(claims, completionWithFullDrops(fullDrops))
        const legacy = legacyRank(claims, fullDrops)
        expect(
          { key: declarative.key, level: declarative.level },
          `claims=${claims} fullDrops=${fullDrops}`,
        ).toEqual(legacy)
      }
    }
  })

  it('keeps the code-owned emblem fallback', () => {
    expect(deriveArmoryRank(0, []).emblemSrc).toBe('/brand/ranks/initiate.png')
  })

  it('honors a CMS emblem override', () => {
    const rules = structuredClone(DEFAULT_GAMIFICATION_RULES)
    rules.ranks[0]!.emblemUrl = 'https://cdn.example/initiate-custom.png'
    expect(deriveArmoryRank(0, [], rules).emblemSrc).toBe(
      'https://cdn.example/initiate-custom.png',
    )
  })

  it('respects edited thresholds', () => {
    const rules = structuredClone(DEFAULT_GAMIFICATION_RULES)
    const forgedI = rules.ranks[1]!.levels[0]!
    forgedI.minRegistrations = 2
    expect(deriveArmoryRank(2, [], rules)).toMatchObject({ key: 'forged', level: 1 })
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
