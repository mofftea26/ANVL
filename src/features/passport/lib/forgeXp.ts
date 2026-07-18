import type { DropCompletion } from './ranks'
import { deriveArmoryRank } from './ranks'
import type { OwnedPassport } from '../schemas/passport.schema'
import {
  DEFAULT_GAMIFICATION_RULES,
  type GamificationRules,
  type GamificationXpSettings,
} from '../schemas/gamification.schema'

/**
 * Forge XP — the granular progression that sits under the prestige ranks. Every
 * real action earns XP (registering a piece, training in it, logging a feat,
 * completing a drop), so the armory always has a next number to chase. The XP
 * constants + level curve come from `gamification_settings` (editable in
 * /admin/gamification); defaults equal the seed. Ranks stay the identity;
 * Forge Level is the dopamine loop. No serial-number mechanics.
 */

const DEFAULT_XP = DEFAULT_GAMIFICATION_RULES.settings

export const XP_PER_REGISTRATION = DEFAULT_XP.xpPerRegistration
export const XP_PER_WEAR = DEFAULT_XP.xpPerWear
export const XP_PER_FEAT = DEFAULT_XP.xpPerFeat
export const XP_PER_FULL_DROP = DEFAULT_XP.xpPerFullDrop

export interface ForgeXpBreakdown {
  registrations: number
  wears: number
  feats: number
  fullDrops: number
  total: number
}

export interface ForgeLevel {
  level: number
  /** XP earned inside the current level. */
  xpIntoLevel: number
  /** XP span of the current level (into + remaining). */
  xpForLevel: number
  /** XP still needed to reach the next level. */
  xpToNext: number
  /** 0..1 fill of the current level. */
  progress: number
  total: number
  breakdown: ForgeXpBreakdown
}

/** Cumulative XP required to *reach* level L (L≥1). Quadratic → leveling slows. */
export function cumulativeXpForLevel(
  level: number,
  curveFactor: number = DEFAULT_XP.levelCurveFactor,
): number {
  const l = Math.max(1, Math.floor(level))
  return curveFactor * l * (l - 1)
}

function completedDropCount(completion: readonly DropCompletion[]): number {
  return completion.filter((d) => d.total > 0 && d.claimed >= d.total).length
}

export function computeForgeXpBreakdown(
  input: {
    owned: readonly OwnedPassport[]
    featCount: number
    completion: readonly DropCompletion[]
  },
  settings: GamificationXpSettings = DEFAULT_XP,
): ForgeXpBreakdown {
  const registrations = input.owned.length * settings.xpPerRegistration
  const totalWears = input.owned.reduce((sum, p) => sum + p.wearCount, 0)
  const wears = totalWears * settings.xpPerWear
  const feats = input.featCount * settings.xpPerFeat
  const fullDrops = completedDropCount(input.completion) * settings.xpPerFullDrop
  return {
    registrations,
    wears,
    feats,
    fullDrops,
    total: registrations + wears + feats + fullDrops,
  }
}

export function computeForgeLevel(
  input: {
    owned: readonly OwnedPassport[]
    featCount: number
    completion: readonly DropCompletion[]
  },
  settings: GamificationXpSettings = DEFAULT_XP,
): ForgeLevel {
  const breakdown = computeForgeXpBreakdown(input, settings)
  const total = breakdown.total
  const factor = settings.levelCurveFactor

  let level = 1
  while (cumulativeXpForLevel(level + 1, factor) <= total) level += 1

  const base = cumulativeXpForLevel(level, factor)
  const next = cumulativeXpForLevel(level + 1, factor)
  const xpForLevel = next - base
  const xpIntoLevel = total - base
  const xpToNext = next - total

  return {
    level,
    xpIntoLevel,
    xpForLevel,
    xpToNext,
    progress: xpForLevel > 0 ? xpIntoLevel / xpForLevel : 0,
    total,
    breakdown,
  }
}

export interface NextMilestone {
  label: string
  detail: string
}

/**
 * The nearest concrete goal to dangle — whichever of "next Forge Level" or
 * "next rank" is closer in spirit. Always returns something to chase.
 */
export function nextForgeMilestone(
  input: {
    claimCount: number
    completion: readonly DropCompletion[]
    forge: ForgeLevel
  },
  rules: GamificationRules = DEFAULT_GAMIFICATION_RULES,
): NextMilestone {
  const { claimCount, completion, forge } = input
  const currentRank = deriveArmoryRank(claimCount, completion, rules)

  // Find the fewest extra registrations that would change the rank title.
  for (let extra = 1; extra <= 4; extra += 1) {
    const nextRank = deriveArmoryRank(claimCount + extra, completion, rules)
    if (nextRank.title !== currentRank.title) {
      return {
        label: nextRank.title,
        detail: `${extra} more ${extra === 1 ? 'piece' : 'pieces'} to rank up`,
      }
    }
  }

  return {
    label: `Forge Level ${forge.level + 1}`,
    detail: `${forge.xpToNext} XP to go`,
  }
}
