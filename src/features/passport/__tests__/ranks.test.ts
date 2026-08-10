import { describe, expect, it } from 'vitest'
import {
  computeDropCompletion,
  deriveArmoryBadges,
  deriveArmoryRank,
  hasFullDrop,
} from '@/features/passport/lib/ranks'
import { DEFAULT_GAMIFICATION_RULES } from '@/features/passport/schemas/gamification.schema'

const catalog = [
  { slug: 'seamless-tee', dropName: 'The Oath' },
  { slug: 'forged-shorts', dropName: 'The Oath' },
  { slug: 'oath-hoodie', dropName: 'The Oath' },
]

const fullOath = [{ dropName: 'The Oath', claimed: 3, total: 3 }]

describe('computeDropCompletion', () => {
  it('counts distinct claimed products per drop', () => {
    const completion = computeDropCompletion(
      [
        { productSlug: 'seamless-tee' },
        { productSlug: 'seamless-tee' }, // duplicate unit — still one product
        { productSlug: 'forged-shorts' },
      ],
      catalog,
    )
    expect(completion).toEqual([{ dropName: 'The Oath', claimed: 2, total: 3 }])
  })

  it('ignores claimed products that left the catalog', () => {
    const completion = computeDropCompletion([{ productSlug: 'retired-piece' }], catalog)
    expect(completion[0]).toMatchObject({ claimed: 0, total: 3 })
  })

  it('skips catalog entries without a drop name', () => {
    const completion = computeDropCompletion([], [{ slug: 'x', dropName: '' }])
    expect(completion).toEqual([])
  })
})

describe('deriveArmoryRank — XP-gated ladder', () => {
  const R = DEFAULT_GAMIFICATION_RULES

  /** Rank at a given XP with no claims/completion, the common case here. */
  const at = (xp: number) => deriveArmoryRank(0, [], R, xp)

  it('walks the Unsworn and Initiate levels by XP', () => {
    expect(at(0)).toMatchObject({ key: 'unsworn', level: 1, title: 'Unsworn I' })
    expect(at(40)).toMatchObject({ key: 'unsworn', level: 2 })
    expect(at(80)).toMatchObject({ key: 'unsworn', level: 3 })
    // Initiate I also requires a claim, so XP alone is not enough.
    expect(at(100)).toMatchObject({ key: 'unsworn', level: 3 })
    expect(deriveArmoryRank(1, [], R, 100)).toMatchObject({ key: 'initiate', level: 1 })
    expect(deriveArmoryRank(1, [], R, 360)).toMatchObject({ key: 'initiate', level: 2 })
    expect(deriveArmoryRank(1, [], R, 555)).toMatchObject({ key: 'initiate', level: 3 })
  })

  it('walks Forged, Oathsworn, Warden and Vanguard by XP alone', () => {
    expect(at(750)).toMatchObject({ key: 'forged', level: 1, title: 'Forged I' })
    expect(at(1625)).toMatchObject({ key: 'forged', level: 3 })
    expect(at(2000)).toMatchObject({ key: 'oathbound', level: 1, title: 'Oathsworn I' })
    expect(at(4500)).toMatchObject({ key: 'warden', level: 1 })
    expect(at(9000)).toMatchObject({ key: 'vanguard', level: 1 })
    expect(at(15300)).toMatchObject({ key: 'vanguard', level: 3 })
  })

  it('Warlord needs a completed drop as well as the XP', () => {
    expect(hasFullDrop(fullOath)).toBe(true)
    // XP is there, the drop is not — so the ladder stops below Warlord.
    expect(at(18000)).toMatchObject({ key: 'vanguard', level: 3 })
    expect(deriveArmoryRank(3, fullOath, R, 18000)).toMatchObject({ key: 'warlord', level: 1 })
    expect(
      deriveArmoryRank(
        20,
        [
          { dropName: 'The Oath', claimed: 3, total: 3 },
          { dropName: 'Drop 02', claimed: 4, total: 4 },
        ],
        R,
        26800,
      ),
    ).toMatchObject({ key: 'warlord', level: 2 })
  })

  it('reaches Anvilborn only at the top of the curve', () => {
    expect(at(39999)).not.toMatchObject({ key: 'anvilborn' })
    expect(at(40000)).toMatchObject({ key: 'anvilborn', level: 1 })
    expect(at(85000)).toMatchObject({ key: 'anvilborn', level: 3, title: 'Anvilborn III' })
  })

  /**
   * REGRESSION. An XP-only ladder has almost no count thresholds left, so any
   * caller that fails to gate on XP finds every level matching and returns the
   * LAST one walked — the top rank. That shipped briefly during the v2 build
   * and promoted a brand-new, zero-XP account straight to Anvilborn III, which
   * carries the "one free piece" reward. The floor must hold at zero.
   */
  it('a zero-XP owner derives the FLOOR rank, never the top one', () => {
    const floor = deriveArmoryRank(0, [], R, 0)
    expect(floor.key).toBe('unsworn')
    expect(floor.level).toBe(1)
    expect(floor.key).not.toBe('anvilborn')
  })

  it('an empty drop never counts as complete', () => {
    expect(hasFullDrop([{ dropName: 'X', claimed: 0, total: 0 }])).toBe(false)
    expect(
      deriveArmoryRank(0, [{ dropName: 'X', claimed: 0, total: 0 }], R, 0),
    ).toMatchObject({ key: 'unsworn' })
  })

  it('seeded ranks carry code-owned emblem artwork', () => {
    expect(deriveArmoryRank(1, [], R, 100).emblemSrc).toBe('/brand/ranks/initiate.png')
    expect(at(750).emblemSrc).toBe('/brand/ranks/forged.png')
    expect(at(2000).emblemSrc).toBe('/brand/ranks/oathbound.png')
    expect(deriveArmoryRank(3, fullOath, R, 18000).emblemSrc).toBe('/brand/ranks/warlord.png')
  })
})

describe('deriveArmoryBadges', () => {
  it('grants nothing on an empty armory', () => {
    expect(deriveArmoryBadges(0, [])).toEqual([])
  })

  it('grants first strike + full drop — and nothing serial-based', () => {
    const badges = deriveArmoryBadges(3, fullOath)
    expect(badges.map((b) => b.key)).toEqual(['first-claim', 'full-drop'])
  })

  it('first strike alone without a completed drop', () => {
    expect(deriveArmoryBadges(1, []).map((b) => b.key)).toEqual(['first-claim'])
  })
})
