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
