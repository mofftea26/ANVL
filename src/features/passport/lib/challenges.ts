import type { DropCompletion } from './ranks'
import type { OwnedPassport } from '../schemas/passport.schema'
import {
  DEFAULT_GAMIFICATION_RULES,
  type ChallengeCategory,
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
 */
export function evaluateChallenges(
  ctx: ChallengeContext,
  rules: GamificationRules = DEFAULT_GAMIFICATION_RULES,
): ChallengeProgress[] {
  return [...rules.challenges]
    .filter((def) => def.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((def) => {
      const current = Math.min(CHALLENGE_METRIC_ACCESSORS[def.metric](ctx), def.target)
      return {
        id: def.key,
        category: def.category,
        title: def.title,
        description: def.description,
        current,
        target: def.target,
        progress: def.target > 0 ? current / def.target : 0,
        complete: current >= def.target,
      }
    })
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? 1 : -1
      return b.progress - a.progress
    })
}
