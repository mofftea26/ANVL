import type { OwnedPassport } from '../schemas/passport.schema'

/**
 * Armory gamification — ranks (with three levels each), badges, and drop
 * completion are derived client-side from the owner's registered passports
 * plus the storefront catalog. No server state: tamper-proofing is a future
 * concern (see feature doc). NO serial-number-based mechanics (final product
 * decision).
 */

export type ArmoryRankKey = 'initiate' | 'forged' | 'oathbound' | 'warlord'

export interface ArmoryRank {
  key: ArmoryRankKey
  /** 1..3 within the rank (rendered as I · II · III pips). */
  level: 1 | 2 | 3
  /** e.g. "Forged II". */
  title: string
  description: string
  /** Rank emblem artwork (code-owned, public/brand/ranks). */
  emblemSrc: string
}

export interface ArmoryBadge {
  key: 'first-claim' | 'full-drop'
  title: string
  description: string
}

export interface DropCompletion {
  dropName: string
  /** Distinct products of this drop the user has claimed. */
  claimed: number
  /** Distinct products the drop contains in the catalog. */
  total: number
}

/** Catalog shape needed for completion math (subset of `Product`). */
export interface CatalogProductRef {
  slug: string
  dropName: string
}

const ROMAN: Record<1 | 2 | 3, string> = { 1: 'I', 2: 'II', 3: 'III' }

const RANK_COPY: Record<ArmoryRankKey, { title: string; description: string }> = {
  initiate: { title: 'Initiate', description: 'The forge has noticed you.' },
  forged: { title: 'Forged', description: 'Steel with your name on it.' },
  oathbound: { title: 'Oathbound', description: 'The oath holds — piece by piece.' },
  warlord: { title: 'Warlord', description: 'A full drop stands forged in your armory.' },
}

function rank(key: ArmoryRankKey, level: 1 | 2 | 3): ArmoryRank {
  const copy = RANK_COPY[key]
  return {
    key,
    level,
    title: `${copy.title} ${ROMAN[level]}`,
    description: copy.description,
    emblemSrc: `/brand/ranks/${key}.png`,
  }
}

/**
 * Distinct-product completion per drop. Only drops present in the catalog
 * count; claimed passports for products no longer in the catalog are ignored
 * for completion (they still count toward rank thresholds).
 */
export function computeDropCompletion(
  owned: readonly Pick<OwnedPassport, 'productSlug'>[],
  catalog: readonly CatalogProductRef[],
): DropCompletion[] {
  const ownedSlugs = new Set(owned.map((p) => p.productSlug))
  const byDrop = new Map<string, { claimed: Set<string>; total: number }>()
  for (const product of catalog) {
    if (!product.dropName) continue
    const entry = byDrop.get(product.dropName) ?? { claimed: new Set<string>(), total: 0 }
    entry.total += 1
    if (ownedSlugs.has(product.slug)) entry.claimed.add(product.slug)
    byDrop.set(product.dropName, entry)
  }
  return [...byDrop.entries()].map(([dropName, { claimed, total }]) => ({
    dropName,
    claimed: claimed.size,
    total,
  }))
}

export function hasFullDrop(completion: readonly DropCompletion[]): boolean {
  return completion.some((d) => d.total > 0 && d.claimed >= d.total)
}

function completedDropCount(completion: readonly DropCompletion[]): number {
  return completion.filter((d) => d.total > 0 && d.claimed >= d.total).length
}

/**
 * Rank ladder (each rank has levels I–III; thresholds are tunable copy):
 *   Initiate  I/II/III → 0 / 1 / 2 registrations
 *   Forged    I/II/III → 3 / 4 / 5
 *   Oathbound I/II/III → 6 / 8 / 10
 *   Warlord   I → one full drop · II → full drop + 12 pieces · III → two full drops
 */
export function deriveArmoryRank(
  claimCount: number,
  completion: readonly DropCompletion[],
): ArmoryRank {
  const fullDrops = completedDropCount(completion)
  if (fullDrops >= 2) return rank('warlord', 3)
  if (fullDrops >= 1 && claimCount >= 12) return rank('warlord', 2)
  if (fullDrops >= 1) return rank('warlord', 1)
  if (claimCount >= 10) return rank('oathbound', 3)
  if (claimCount >= 8) return rank('oathbound', 2)
  if (claimCount >= 6) return rank('oathbound', 1)
  if (claimCount >= 5) return rank('forged', 3)
  if (claimCount >= 4) return rank('forged', 2)
  if (claimCount >= 3) return rank('forged', 1)
  if (claimCount >= 2) return rank('initiate', 3)
  if (claimCount >= 1) return rank('initiate', 2)
  return rank('initiate', 1)
}

/** Full rank ladder for the "how do I rank up" modal (display metadata). */
export interface RankLadderLevel {
  level: 1 | 2 | 3
  title: string
  unlock: string
}
export interface RankLadderEntry {
  key: ArmoryRankKey
  name: string
  description: string
  emblemSrc: string
  levels: RankLadderLevel[]
}

export const ARMORY_RANK_LADDER: RankLadderEntry[] = (
  [
    ['initiate', ['Begin your armory', 'Register 1 piece', 'Register 2 pieces']],
    ['forged', ['Register 3 pieces', 'Register 4 pieces', 'Register 5 pieces']],
    ['oathbound', ['Register 6 pieces', 'Register 8 pieces', 'Register 10 pieces']],
    ['warlord', ['Complete a full drop', 'A full drop + 12 pieces', 'Complete two drops']],
  ] as const
).map(([key, unlocks]) => ({
  key,
  name: RANK_COPY[key].title,
  description: RANK_COPY[key].description,
  emblemSrc: `/brand/ranks/${key}.png`,
  levels: unlocks.map((unlock, i) => {
    const level = (i + 1) as 1 | 2 | 3
    return { level, title: `${RANK_COPY[key].title} ${ROMAN[level]}`, unlock }
  }),
}))

/** Every badge that can be earned, for display in the ranks modal. */
export const ARMORY_BADGE_CATALOG: ArmoryBadge[] = [
  {
    key: 'first-claim',
    title: 'First Strike',
    description: 'Registered your first passport.',
  },
  { key: 'full-drop', title: 'Drop Complete', description: 'Every piece of a drop, registered.' },
]

/** Badges — none are serial-number based (final product decision). */
export function deriveArmoryBadges(
  ownedCount: number,
  completion: readonly DropCompletion[],
): ArmoryBadge[] {
  const badges: ArmoryBadge[] = []
  if (ownedCount >= 1) {
    badges.push({
      key: 'first-claim',
      title: 'First Strike',
      description: 'Registered your first passport.',
    })
  }
  if (hasFullDrop(completion)) {
    badges.push({
      key: 'full-drop',
      title: 'Drop Complete',
      description: 'Every piece of a drop, registered.',
    })
  }
  return badges
}
