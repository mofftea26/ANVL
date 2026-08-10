import type { DropCompletion } from './ranks'
import type { OwnedPassport } from '../schemas/passport.schema'
import {
  DEFAULT_GAMIFICATION_RULES,
  type ChallengeCategory,
  type ChallengeDifficulty,
  type GamificationMetric,
  type GamificationRules,
} from '../schemas/gamification.schema'

/**
 * Challenges — the armory's quest log. The catalog (titles, metrics, targets,
 * order) comes from the editable `gamification_challenges` table via
 * `useGamificationRules`; progress is derived from what the owner has actually
 * done, through the fixed declarative metric vocabulary below.
 */

export interface ChallengeContext {
  registrations: number
  totalWears: number
  /** Most wears logged on any single piece. */
  maxWears: number
  featCount: number
  fullDrops: number
  honorPinned: number
  /* ---- v2 ---------------------------------------------------------------
   * Everything below is OPTIONAL on purpose. Each needs a source the owner's
   * passport rows cannot supply — the wear log, the reviews table, or a
   * counter that does not exist yet. A caller that has not loaded a given
   * source omits it, and the accessor reads 0, so the challenge simply sits
   * at 0% instead of the whole log throwing.
   *
   * `resolveChallenges` filters out challenges whose source is absent (see
   * UNSOURCED_METRICS), so an unloaded source shows nothing rather than a
   * permanently-stuck row.
   */
  /** Longest run of consecutive days with a logged wear. */
  streakDays?: number
  /** Longest run of consecutive ISO weeks containing at least one wear. */
  weeklyStreak?: number
  /** Distinct calendar months containing at least one wear. */
  distinctMonths?: number
  /** Wears logged before 08:00 local time. */
  earlyWears?: number
  reviews?: number
  publicFeats?: number
  transfersOut?: number
  transfersIn?: number
  /** Whole days since the owner's first claim. */
  tenureDays?: number
  /** 1 when the armory is public with a minted handle, else 0. */
  armoryPublic?: number
  /** Most colourways owned of any single product. */
  distinctColorways?: number
  /** Most divisions owned within a single drop. */
  divisionsOwned?: number
  shares?: number
  chaptersRead?: number
}

/** Reads an optional context number, treating absent as zero. */
function opt(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export type { ChallengeCategory }

/** Display order + labels for the categorized challenge log. */
export const CHALLENGE_CATEGORIES: Array<{ key: ChallengeCategory; label: string }> = [
  { key: 'forge', label: 'The Forge' },
  { key: 'ritual', label: 'The Ritual' },
  { key: 'record', label: 'The Record' },
  { key: 'honor', label: 'The Honor' },
]

/** The fixed metric vocabulary — every DB metric maps to a context read. */
export const CHALLENGE_METRIC_ACCESSORS: Record<
  GamificationMetric,
  (ctx: ChallengeContext) => number
> = {
  registrations: (c) => c.registrations,
  total_wears: (c) => c.totalWears,
  max_wears: (c) => c.maxWears,
  feat_count: (c) => c.featCount,
  full_drops: (c) => c.fullDrops,
  honor_pinned: (c) => c.honorPinned,
  streak_days: (c) => opt(c.streakDays),
  weekly_streak: (c) => opt(c.weeklyStreak),
  distinct_months: (c) => opt(c.distinctMonths),
  early_wears: (c) => opt(c.earlyWears),
  reviews: (c) => opt(c.reviews),
  public_feats: (c) => opt(c.publicFeats),
  transfers_out: (c) => opt(c.transfersOut),
  transfers_in: (c) => opt(c.transfersIn),
  tenure_days: (c) => opt(c.tenureDays),
  armory_public: (c) => opt(c.armoryPublic),
  distinct_colorways: (c) => opt(c.distinctColorways),
  divisions_owned: (c) => opt(c.divisionsOwned),
  shares: (c) => opt(c.shares),
  chapters_read: (c) => opt(c.chaptersRead),
}

/**
 * Metrics whose source is not wired up yet. A challenge on one of these can
 * never move off 0%, and a quest log full of permanently-empty rows reads as
 * broken rather than aspirational — so `resolveChallenges` hides them.
 *
 * Delete an entry from this set the moment its counter ships; the challenges
 * are already authored and will simply appear.
 */
export const UNSOURCED_METRICS: ReadonlySet<GamificationMetric> = new Set([
  'shares',
  'chapters_read',
])

/** Which context keys each metric depends on, for the "is it loaded" check. */
const METRIC_CONTEXT_KEY: Partial<Record<GamificationMetric, keyof ChallengeContext>> = {
  streak_days: 'streakDays',
  weekly_streak: 'weeklyStreak',
  distinct_months: 'distinctMonths',
  early_wears: 'earlyWears',
  reviews: 'reviews',
  public_feats: 'publicFeats',
  transfers_out: 'transfersOut',
  transfers_in: 'transfersIn',
  tenure_days: 'tenureDays',
  armory_public: 'armoryPublic',
  distinct_colorways: 'distinctColorways',
  divisions_owned: 'divisionsOwned',
  shares: 'shares',
  chapters_read: 'chaptersRead',
}

/**
 * Whether a challenge on this metric should be shown at all: its counter must
 * exist, and the caller must actually have loaded the source.
 */
export function isMetricAvailable(
  metric: GamificationMetric,
  ctx: ChallengeContext,
): boolean {
  if (UNSOURCED_METRICS.has(metric)) return false
  const key = METRIC_CONTEXT_KEY[metric]
  if (!key) return true // one of the six original passport-derived metrics
  return ctx[key] !== undefined
}

export interface ChallengeProgress {
  id: string
  category: ChallengeCategory
  title: string
  description: string
  current: number
  target: number
  progress: number
  complete: boolean
  difficulty: ChallengeDifficulty
  /** XP awarded for the tier currently being chased. */
  xpReward: number
  /** 1-based position of the active tier within its family. */
  tier: number
  /** How many tiers the family has (1 for a standalone challenge). */
  tierCount: number
  /** True once every tier in the family is complete. */
  familyComplete: boolean
}

export function buildChallengeContext(input: {
  owned: readonly OwnedPassport[]
  featCount: number
  completion: readonly DropCompletion[]
}): ChallengeContext {
  const { owned, featCount, completion } = input
  return {
    registrations: owned.length,
    totalWears: owned.reduce((sum, p) => sum + p.wearCount, 0),
    maxWears: owned.reduce((max, p) => Math.max(max, p.wearCount), 0),
    featCount,
    fullDrops: completion.filter((d) => d.total > 0 && d.claimed >= d.total).length,
    honorPinned: owned.filter((p) => p.featuredSlot !== null).length,
  }
}

/**
 * Progress for every active challenge, incomplete first (nearest to done
 * leading), so the next goal is always at the top; finished ones settle to
 * the bottom.
 *
 * TIERED FAMILIES COLLAPSE TO ONE ENTRY. A family like Battle-Worn is five
 * rows in the rules (25 / 100 / 365 / 1000 wears), but showing all five at
 * once buries the quest log in variants of the same goal and makes the log
 * look padded. Instead each family yields the LOWEST tier not yet finished —
 * the one actually being chased — or its final tier once they are all done.
 *
 * Challenges whose metric has no counter behind it, or whose source the caller
 * has not loaded, are dropped entirely: a row pinned at 0% forever reads as
 * broken rather than aspirational (see `isMetricAvailable`).
 */
export function evaluateChallenges(
  ctx: ChallengeContext,
  rules: GamificationRules = DEFAULT_GAMIFICATION_RULES,
): ChallengeProgress[] {
  const active = [...rules.challenges]
    .filter((def) => def.isActive && isMetricAvailable(def.metric, ctx))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // Group by family. A null `tierGroup` is standalone, so it gets a unique
  // bucket keyed by its own key — never merged with another standalone.
  const families = new Map<string, typeof active>()
  for (const def of active) {
    const groupKey = def.tierGroup ?? `@solo:${def.key}`
    const bucket = families.get(groupKey)
    if (bucket) bucket.push(def)
    else families.set(groupKey, [def])
  }

  const rows: ChallengeProgress[] = []
  for (const bucket of families.values()) {
    const tiers = [...bucket].sort((a, b) => a.tier - b.tier)
    const withProgress = tiers.map((def) => ({
      def,
      raw: CHALLENGE_METRIC_ACCESSORS[def.metric](ctx),
    }))

    // The tier being chased: first one not yet met. If all are met, the family
    // is finished and the last tier stands as its completed face.
    const activeIndex = withProgress.findIndex((t) => t.raw < t.def.target)
    const familyComplete = activeIndex === -1
    const chosen = familyComplete
      ? withProgress[withProgress.length - 1]!
      : withProgress[activeIndex]!

    const current = Math.min(chosen.raw, chosen.def.target)
    rows.push({
      id: chosen.def.key,
      category: chosen.def.category,
      title: chosen.def.title,
      description: chosen.def.description,
      current,
      target: chosen.def.target,
      progress: chosen.def.target > 0 ? current / chosen.def.target : 0,
      complete: current >= chosen.def.target,
      difficulty: chosen.def.difficulty,
      xpReward: chosen.def.xpReward,
      tier: chosen.def.tier,
      tierCount: tiers.length,
      familyComplete,
    })
  }

  return rows.sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1
    return b.progress - a.progress
  })
}
