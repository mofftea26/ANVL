import { z } from 'zod'

/**
 * Gamification rules — the Armory's editable rule set (ranks, challenges,
 * badges, Forge XP settings), served from the `gamification_*` Supabase tables
 * and edited in `/admin/gamification`. `DEFAULT_GAMIFICATION_RULES` mirrors the
 * seed migration exactly, so a missing/unreachable DB behaves identically to
 * the historical hardcoded rules.
 */

export const ARMORY_RANK_KEYS = ['initiate', 'forged', 'oathbound', 'warlord'] as const
export type ArmoryRankKey = (typeof ARMORY_RANK_KEYS)[number]

export const GAMIFICATION_METRICS = [
  'registrations',
  'total_wears',
  'max_wears',
  'feat_count',
  'full_drops',
  'honor_pinned',
] as const
export type GamificationMetric = (typeof GAMIFICATION_METRICS)[number]

/** Plain-English labels for the admin metric dropdowns. */
export const GAMIFICATION_METRIC_LABELS: Record<GamificationMetric, string> = {
  registrations: 'Pieces registered',
  total_wears: 'Total wears logged',
  max_wears: 'Most wears on one piece',
  feat_count: 'Feats logged',
  full_drops: 'Full drops completed',
  honor_pinned: 'Hall of Honor slots filled',
}

export const CHALLENGE_CATEGORY_KEYS = ['forge', 'ritual', 'record', 'honor'] as const
export type ChallengeCategory = (typeof CHALLENGE_CATEGORY_KEYS)[number]

const rankLevelSchema = z.object({
  rankKey: z.enum(ARMORY_RANK_KEYS),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  unlockCopy: z.string(),
  minRegistrations: z.number().int().min(0).nullable(),
  minFullDrops: z.number().int().min(0).nullable(),
})
export type GamificationRankLevelRule = z.infer<typeof rankLevelSchema>

const rankSchema = z.object({
  key: z.enum(ARMORY_RANK_KEYS),
  sortOrder: z.number().int(),
  name: z.string().min(1),
  description: z.string(),
  emblemUrl: z.string().nullable(),
  levels: z.array(rankLevelSchema),
})
export type GamificationRankRule = z.infer<typeof rankSchema>

const challengeSchema = z.object({
  key: z.string().min(1),
  category: z.enum(CHALLENGE_CATEGORY_KEYS),
  title: z.string().min(1),
  description: z.string(),
  metric: z.enum(GAMIFICATION_METRICS),
  target: z.number().int().min(1),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
})
export type GamificationChallengeRule = z.infer<typeof challengeSchema>

const badgeSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  metric: z.enum(GAMIFICATION_METRICS),
  target: z.number().int().min(1),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
})
export type GamificationBadgeRule = z.infer<typeof badgeSchema>

const xpSettingsSchema = z.object({
  xpPerRegistration: z.number().int().min(0),
  xpPerWear: z.number().int().min(0),
  xpPerFeat: z.number().int().min(0),
  xpPerFullDrop: z.number().int().min(0),
  levelCurveFactor: z.number().int().min(1),
})
export type GamificationXpSettings = z.infer<typeof xpSettingsSchema>

export const gamificationRulesSchema = z.object({
  settings: xpSettingsSchema,
  ranks: z.array(rankSchema),
  challenges: z.array(challengeSchema),
  badges: z.array(badgeSchema),
})
export type GamificationRules = z.infer<typeof gamificationRulesSchema>

/** Raw DB row shapes (snake_case) for the anon rules fetch. */
export const gamificationDbRowSchemas = {
  settings: z.object({
    xp_per_registration: z.number().int(),
    xp_per_wear: z.number().int(),
    xp_per_feat: z.number().int(),
    xp_per_full_drop: z.number().int(),
    level_curve_factor: z.number().int(),
  }),
  rank: z.object({
    key: z.enum(ARMORY_RANK_KEYS),
    sort_order: z.number().int(),
    name: z.string(),
    description: z.string(),
    emblem_url: z.string().nullable(),
  }),
  rankLevel: z.object({
    rank_key: z.enum(ARMORY_RANK_KEYS),
    level: z.number().int().min(1).max(3),
    unlock_copy: z.string(),
    min_registrations: z.number().int().nullable(),
    min_full_drops: z.number().int().nullable(),
  }),
  challenge: z.object({
    key: z.string(),
    category: z.enum(CHALLENGE_CATEGORY_KEYS),
    title: z.string(),
    description: z.string(),
    metric: z.enum(GAMIFICATION_METRICS),
    target: z.number().int(),
    sort_order: z.number().int(),
    is_active: z.boolean(),
  }),
  badge: z.object({
    key: z.string(),
    title: z.string(),
    description: z.string(),
    metric: z.enum(GAMIFICATION_METRICS),
    target: z.number().int(),
    sort_order: z.number().int(),
    is_active: z.boolean(),
  }),
}

function levels(
  rankKey: ArmoryRankKey,
  rows: Array<[1 | 2 | 3, string, number | null, number | null]>,
): GamificationRankLevelRule[] {
  return rows.map(([level, unlockCopy, minRegistrations, minFullDrops]) => ({
    rankKey,
    level,
    unlockCopy,
    minRegistrations,
    minFullDrops,
  }))
}

/** Exact mirror of the seed migration (and the historical hardcoded rules). */
export const DEFAULT_GAMIFICATION_RULES: GamificationRules = {
  settings: {
    xpPerRegistration: 100,
    xpPerWear: 5,
    xpPerFeat: 20,
    xpPerFullDrop: 200,
    levelCurveFactor: 75,
  },
  ranks: [
    {
      key: 'initiate',
      sortOrder: 0,
      name: 'Initiate',
      description: 'The forge has noticed you.',
      emblemUrl: null,
      levels: levels('initiate', [
        [1, 'Begin your armory', null, null],
        [2, 'Register 1 piece', 1, null],
        [3, 'Register 2 pieces', 2, null],
      ]),
    },
    {
      key: 'forged',
      sortOrder: 1,
      name: 'Forged',
      description: 'Steel with your name on it.',
      emblemUrl: null,
      levels: levels('forged', [
        [1, 'Register 3 pieces', 3, null],
        [2, 'Register 4 pieces', 4, null],
        [3, 'Register 5 pieces', 5, null],
      ]),
    },
    {
      key: 'oathbound',
      sortOrder: 2,
      name: 'Oathbound',
      description: 'The oath holds — piece by piece.',
      emblemUrl: null,
      levels: levels('oathbound', [
        [1, 'Register 6 pieces', 6, null],
        [2, 'Register 8 pieces', 8, null],
        [3, 'Register 10 pieces', 10, null],
      ]),
    },
    {
      key: 'warlord',
      sortOrder: 3,
      name: 'Warlord',
      description: 'A full drop stands forged in your armory.',
      emblemUrl: null,
      levels: levels('warlord', [
        [1, 'Complete a full drop', null, 1],
        [2, 'A full drop + 12 pieces', 12, 1],
        [3, 'Complete two drops', null, 2],
      ]),
    },
  ],
  challenges: [
    { key: 'first-strike', category: 'forge', title: 'First Strike', description: 'Register your first piece.', metric: 'registrations', target: 1, sortOrder: 0, isActive: true },
    { key: 'loadout', category: 'forge', title: 'Full Loadout', description: 'Register three pieces.', metric: 'registrations', target: 3, sortOrder: 1, isActive: true },
    { key: 'battle-worn', category: 'ritual', title: 'Battle-Worn', description: 'Log 25 wears across your armory.', metric: 'total_wears', target: 25, sortOrder: 2, isActive: true },
    { key: 'devotion', category: 'ritual', title: 'Devotion', description: 'Train in a single piece 20 times.', metric: 'max_wears', target: 20, sortOrder: 3, isActive: true },
    { key: 'record-keeper', category: 'record', title: 'Record Keeper', description: 'Log five feats.', metric: 'feat_count', target: 5, sortOrder: 4, isActive: true },
    { key: 'curator', category: 'honor', title: 'Curator', description: 'Fill all three Hall of Honor slots.', metric: 'honor_pinned', target: 3, sortOrder: 5, isActive: true },
    { key: 'warlord', category: 'forge', title: 'Warlord', description: 'Complete a full drop.', metric: 'full_drops', target: 1, sortOrder: 6, isActive: true },
  ],
  badges: [
    { key: 'first-claim', title: 'First Strike', description: 'Registered your first passport.', metric: 'registrations', target: 1, sortOrder: 0, isActive: true },
    { key: 'full-drop', title: 'Drop Complete', description: 'Every piece of a drop, registered.', metric: 'full_drops', target: 1, sortOrder: 1, isActive: true },
  ],
}
