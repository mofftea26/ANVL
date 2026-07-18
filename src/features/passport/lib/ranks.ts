import type { OwnedPassport } from '../schemas/passport.schema'
import {
  DEFAULT_GAMIFICATION_RULES,
  type ArmoryRankKey,
  type GamificationBadgeRule,
  type GamificationMetric,
  type GamificationRules,
} from '../schemas/gamification.schema'

/**
 * Armory gamification — ranks (with three levels each), badges, and drop
 * completion, derived client-side from the owner's registered passports plus
 * the storefront catalog. The RULES (thresholds, copy, emblems) come from the
 * editable `gamification_*` tables via `useGamificationRules`; every function
 * defaults to `DEFAULT_GAMIFICATION_RULES` (== the DB seed), so callers
 * without rules behave exactly like the historical hardcoded ladder.
 * NO serial-number-based mechanics (final product decision).
 */

export type { ArmoryRankKey }

export interface ArmoryRank {
  key: ArmoryRankKey
  /** 1..3 within the rank (rendered as I · II · III pips). */
  level: 1 | 2 | 3
  /** e.g. "Forged II". */
  title: string
  description: string
  /** Rank emblem artwork (CMS override or code-owned /brand/ranks). */
  emblemSrc: string
}

export interface ArmoryBadge {
  key: string
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

/** CMS emblem override wins; the code-owned artwork is the fallback. */
export function rankEmblemSrc(key: ArmoryRankKey, emblemUrl: string | null): string {
  return emblemUrl?.trim() ? emblemUrl : `/brand/ranks/${key}.png`
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
 * Declarative rank derivation: walk the ladder from the top — ranks by
 * `sortOrder` descending, levels III→I — and return the first level whose
 * non-null thresholds (AND-combined) all hold. The seed's Initiate I has no
 * thresholds, so there is always a match.
 */
export function deriveArmoryRank(
  claimCount: number,
  completion: readonly DropCompletion[],
  rules: GamificationRules = DEFAULT_GAMIFICATION_RULES,
): ArmoryRank {
  const fullDrops = completedDropCount(completion)
  const ranksDesc = [...rules.ranks].sort((a, b) => b.sortOrder - a.sortOrder)
  for (const rank of ranksDesc) {
    const levelsDesc = [...rank.levels].sort((a, b) => b.level - a.level)
    for (const level of levelsDesc) {
      const regOk = level.minRegistrations === null || claimCount >= level.minRegistrations
      const dropOk = level.minFullDrops === null || fullDrops >= level.minFullDrops
      if (regOk && dropOk) {
        return {
          key: rank.key,
          level: level.level,
          title: `${rank.name} ${ROMAN[level.level]}`,
          description: rank.description,
          emblemSrc: rankEmblemSrc(rank.key, rank.emblemUrl),
        }
      }
    }
  }
  // Defensive: rules without a floor level (shouldn't happen — seed has one).
  const first = rules.ranks[0] ?? DEFAULT_GAMIFICATION_RULES.ranks[0]!
  return {
    key: first.key,
    level: 1,
    title: `${first.name} I`,
    description: first.description,
    emblemSrc: rankEmblemSrc(first.key, first.emblemUrl),
  }
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

export function buildRankLadder(
  rules: GamificationRules = DEFAULT_GAMIFICATION_RULES,
): RankLadderEntry[] {
  return [...rules.ranks]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((rank) => ({
      key: rank.key,
      name: rank.name,
      description: rank.description,
      emblemSrc: rankEmblemSrc(rank.key, rank.emblemUrl),
      levels: [...rank.levels]
        .sort((a, b) => a.level - b.level)
        .map((level) => ({
          level: level.level,
          title: `${rank.name} ${ROMAN[level.level]}`,
          unlock: level.unlockCopy,
        })),
    }))
}

export const ARMORY_RANK_LADDER: RankLadderEntry[] = buildRankLadder()

/** Metric values available to badge evaluation from (ownedCount, completion). */
function badgeMetricValue(
  metric: GamificationMetric,
  ownedCount: number,
  completion: readonly DropCompletion[],
): number {
  switch (metric) {
    case 'registrations':
      return ownedCount
    case 'full_drops':
      return completedDropCount(completion)
    // Wear/feat/honor metrics need the fuller armory context — badges on those
    // metrics simply stay locked on surfaces that only know claims.
    default:
      return 0
  }
}

/** Every badge that can be earned, for display in the ranks modal. */
export function buildBadgeCatalog(
  rules: GamificationRules = DEFAULT_GAMIFICATION_RULES,
): ArmoryBadge[] {
  return [...rules.badges]
    .filter((b) => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ key, title, description }) => ({ key, title, description }))
}

export const ARMORY_BADGE_CATALOG: ArmoryBadge[] = buildBadgeCatalog()

/** Badges — none are serial-number based (final product decision). */
export function deriveArmoryBadges(
  ownedCount: number,
  completion: readonly DropCompletion[],
  rules: GamificationRules = DEFAULT_GAMIFICATION_RULES,
): ArmoryBadge[] {
  const earned = (badge: GamificationBadgeRule) =>
    badgeMetricValue(badge.metric, ownedCount, completion) >= badge.target
  return [...rules.badges]
    .filter((b) => b.isActive && earned(b))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ key, title, description }) => ({ key, title, description }))
}
