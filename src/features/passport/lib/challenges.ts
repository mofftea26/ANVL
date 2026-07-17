import type { DropCompletion } from './ranks'
import type { OwnedPassport } from '../schemas/passport.schema'

/**
 * Challenges — the armory's quest log. Code-defined, restrained goals whose
 * progress is derived from what the owner has actually done. They give the
 * collection ongoing direction beyond the milestone badges: something always
 * in reach, something always just out of it.
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

export type ChallengeCategory = 'forge' | 'ritual' | 'record' | 'honor'

/** Display order + labels for the categorized challenge log. */
export const CHALLENGE_CATEGORIES: Array<{ key: ChallengeCategory; label: string }> = [
  { key: 'forge', label: 'The Forge' },
  { key: 'ritual', label: 'The Ritual' },
  { key: 'record', label: 'The Record' },
  { key: 'honor', label: 'The Honor' },
]

export interface ChallengeDef {
  id: string
  category: ChallengeCategory
  title: string
  description: string
  target: number
  measure: (ctx: ChallengeContext) => number
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

/** The catalog of challenges (order = display order; completed sink below). */
export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'first-strike',
    category: 'forge',
    title: 'First Strike',
    description: 'Register your first piece.',
    target: 1,
    measure: (c) => c.registrations,
  },
  {
    id: 'loadout',
    category: 'forge',
    title: 'Full Loadout',
    description: 'Register three pieces.',
    target: 3,
    measure: (c) => c.registrations,
  },
  {
    id: 'battle-worn',
    category: 'ritual',
    title: 'Battle-Worn',
    description: 'Log 25 wears across your armory.',
    target: 25,
    measure: (c) => c.totalWears,
  },
  {
    id: 'devotion',
    category: 'ritual',
    title: 'Devotion',
    description: 'Train in a single piece 20 times.',
    target: 20,
    measure: (c) => c.maxWears,
  },
  {
    id: 'record-keeper',
    category: 'record',
    title: 'Record Keeper',
    description: 'Log five feats.',
    target: 5,
    measure: (c) => c.featCount,
  },
  {
    id: 'curator',
    category: 'honor',
    title: 'Curator',
    description: 'Fill all three Hall of Honor slots.',
    target: 3,
    measure: (c) => c.honorPinned,
  },
  {
    id: 'warlord',
    category: 'forge',
    title: 'Warlord',
    description: 'Complete a full drop.',
    target: 1,
    measure: (c) => c.fullDrops,
  },
]

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
 * Progress for every challenge, incomplete first (nearest to done leading), so
 * the next goal is always at the top; finished ones settle to the bottom.
 */
export function evaluateChallenges(ctx: ChallengeContext): ChallengeProgress[] {
  return CHALLENGES.map((def) => {
    const current = Math.min(def.measure(ctx), def.target)
    return {
      id: def.id,
      category: def.category,
      title: def.title,
      description: def.description,
      current,
      target: def.target,
      progress: def.target > 0 ? current / def.target : 0,
      complete: current >= def.target,
    }
  }).sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1
    return b.progress - a.progress
  })
}
