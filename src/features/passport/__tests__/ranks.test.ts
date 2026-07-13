import { describe, expect, it } from 'vitest'
import {
  computeDropCompletion,
  deriveArmoryBadges,
  deriveArmoryRank,
  hasFullDrop,
} from '@/features/passport/lib/ranks'

const catalog = [
  { slug: 'seamless-tee', dropName: 'The Oath' },
  { slug: 'forged-shorts', dropName: 'The Oath' },
  { slug: 'oath-hoodie', dropName: 'The Oath' },
]

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

describe('deriveArmoryRank', () => {
  it('walks the ladder by claim count', () => {
    expect(deriveArmoryRank(0, []).key).toBe('initiate')
    expect(deriveArmoryRank(1, []).key).toBe('forged')
    expect(deriveArmoryRank(2, []).key).toBe('forged')
    expect(deriveArmoryRank(3, []).key).toBe('oathbound')
  })

  it('a full drop outranks everything', () => {
    const completion = [{ dropName: 'The Oath', claimed: 3, total: 3 }]
    expect(hasFullDrop(completion)).toBe(true)
    expect(deriveArmoryRank(3, completion).key).toBe('warlord')
  })

  it('an empty drop never counts as complete', () => {
    expect(hasFullDrop([{ dropName: 'X', claimed: 0, total: 0 }])).toBe(false)
  })
})

describe('deriveArmoryBadges', () => {
  it('grants nothing on an empty armory', () => {
    expect(deriveArmoryBadges([], [])).toEqual([])
  })

  it('grants first claim + low serial + full drop', () => {
    const badges = deriveArmoryBadges(
      [{ serialNumber: 7 }],
      [{ dropName: 'The Oath', claimed: 3, total: 3 }],
    )
    expect(badges.map((b) => b.key)).toEqual(['first-claim', 'low-serial', 'full-drop'])
  })

  it('does not grant low serial above the threshold', () => {
    const badges = deriveArmoryBadges([{ serialNumber: 11 }], [])
    expect(badges.map((b) => b.key)).toEqual(['first-claim'])
  })
})
