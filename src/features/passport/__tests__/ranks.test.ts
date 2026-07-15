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

describe('deriveArmoryRank — three levels per rank', () => {
  it('walks the Initiate levels', () => {
    expect(deriveArmoryRank(0, [])).toMatchObject({ key: 'initiate', level: 1, title: 'Initiate I' })
    expect(deriveArmoryRank(1, [])).toMatchObject({ key: 'initiate', level: 2, title: 'Initiate II' })
    expect(deriveArmoryRank(2, [])).toMatchObject({ key: 'initiate', level: 3, title: 'Initiate III' })
  })

  it('walks the Forged levels', () => {
    expect(deriveArmoryRank(3, [])).toMatchObject({ key: 'forged', level: 1, title: 'Forged I' })
    expect(deriveArmoryRank(4, [])).toMatchObject({ key: 'forged', level: 2 })
    expect(deriveArmoryRank(5, [])).toMatchObject({ key: 'forged', level: 3 })
  })

  it('walks the Oathbound levels', () => {
    expect(deriveArmoryRank(6, [])).toMatchObject({ key: 'oathbound', level: 1 })
    expect(deriveArmoryRank(8, [])).toMatchObject({ key: 'oathbound', level: 2 })
    expect(deriveArmoryRank(10, [])).toMatchObject({ key: 'oathbound', level: 3, title: 'Oathbound III' })
  })

  it('a full drop promotes to Warlord and levels by depth', () => {
    expect(hasFullDrop(fullOath)).toBe(true)
    expect(deriveArmoryRank(3, fullOath)).toMatchObject({ key: 'warlord', level: 1 })
    expect(deriveArmoryRank(12, fullOath)).toMatchObject({ key: 'warlord', level: 2 })
    expect(
      deriveArmoryRank(20, [
        { dropName: 'The Oath', claimed: 3, total: 3 },
        { dropName: 'Drop 02', claimed: 4, total: 4 },
      ]),
    ).toMatchObject({ key: 'warlord', level: 3, title: 'Warlord III' })
  })

  it('an empty drop never counts as complete', () => {
    expect(hasFullDrop([{ dropName: 'X', claimed: 0, total: 0 }])).toBe(false)
    expect(deriveArmoryRank(0, [{ dropName: 'X', claimed: 0, total: 0 }])).toMatchObject({
      key: 'initiate',
    })
  })

  it('every rank carries emblem artwork', () => {
    expect(deriveArmoryRank(0, []).emblemSrc).toBe('/brand/ranks/initiate.png')
    expect(deriveArmoryRank(3, []).emblemSrc).toBe('/brand/ranks/forged.png')
    expect(deriveArmoryRank(6, []).emblemSrc).toBe('/brand/ranks/oathbound.png')
    expect(deriveArmoryRank(3, fullOath).emblemSrc).toBe('/brand/ranks/warlord.png')
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
