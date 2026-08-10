import { z } from 'zod'

/**
 * Gamification rules — the Armory's editable rule set (ranks, challenges,
 * badges, Forge XP settings), served from the `gamification_*` Supabase tables
 * and edited in `/admin/gamification`. `DEFAULT_GAMIFICATION_RULES` mirrors the
 * seed migration exactly, so a missing/unreachable DB behaves identically to
 * the historical hardcoded rules.
 */

/**
 * The four SEEDED rank keys — these ship code-owned emblem PNGs
 * (`/brand/ranks/{key}.png`). Since migration 20260720120000 the DB accepts
 * any key (admin-created ranks), so the runtime rank-key type is a free
 * string; the seed constants remain for emblem fallbacks and tests.
 */
export const ARMORY_RANK_KEYS = ['initiate', 'forged', 'oathbound', 'warlord'] as const
export type ArmorySeedRankKey = (typeof ARMORY_RANK_KEYS)[number]
export type ArmoryRankKey = string

/**
 * Metric vocabulary. The first six are the original set, derived purely from
 * the owner's passports; everything after them arrived with gamification v2
 * and needs a source the passport rows alone cannot supply — the wear log
 * (`streak_days`, `weekly_streak`, `distinct_months`, `early_wears`), other
 * tables (`reviews`, `public_feats`, `transfers_*`), or a counter that does
 * not exist yet (`shares`, `chapters_read`).
 *
 * Keep this list in sync with the CHECK constraint on
 * `gamification_challenges.metric`; a value here that the DB rejects makes the
 * admin editor able to author a challenge it cannot save.
 */
export const GAMIFICATION_METRICS = [
  'registrations',
  'total_wears',
  'max_wears',
  'feat_count',
  'full_drops',
  'honor_pinned',
  // v2 — wear-log derived
  'streak_days',
  'weekly_streak',
  'distinct_months',
  'early_wears',
  // v2 — other tables
  'reviews',
  'public_feats',
  'transfers_out',
  'transfers_in',
  'tenure_days',
  'armory_public',
  'distinct_colorways',
  'divisions_owned',
  // v2 — needs a counter that does not exist yet
  'shares',
  'chapters_read',
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
  streak_days: 'Consecutive days with a wear',
  weekly_streak: 'Consecutive weeks with a wear',
  distinct_months: 'Different months with a wear',
  early_wears: 'Wears logged before 08:00',
  reviews: 'Verified reviews written',
  public_feats: 'Feats made public',
  transfers_out: 'Passports handed down',
  transfers_in: 'Passports received',
  tenure_days: 'Days since first claim',
  armory_public: 'Armory made public',
  distinct_colorways: 'Colourways of one piece owned',
  divisions_owned: 'Divisions of a drop owned',
  shares: 'Shares sent',
  chapters_read: 'Story chapters read',
}

/**
 * Difficulty bands. The XP value lives per-challenge (`xpReward`) rather than
 * being derived from the band, so a one-off challenge can be priced against
 * its real cost without inventing a new band for it.
 */
export const CHALLENGE_DIFFICULTIES = ['easy', 'medium', 'hard', 'legendary'] as const
export type ChallengeDifficulty = (typeof CHALLENGE_DIFFICULTIES)[number]

export const CHALLENGE_DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  legendary: 'Legendary',
}

/** Reward availability per rank — drives the "coming soon" treatment. */
export const RANK_REWARD_STATUSES = ['none', 'coming_soon', 'live'] as const
export type RankRewardStatus = (typeof RANK_REWARD_STATUSES)[number]

export const CHALLENGE_CATEGORY_KEYS = ['forge', 'ritual', 'record', 'honor'] as const
export type ChallengeCategory = (typeof CHALLENGE_CATEGORY_KEYS)[number]

const rankLevelSchema = z.object({
  rankKey: z.string().min(1),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  unlockCopy: z.string(),
  /**
   * Forge XP required for this level. AND-combined with the two count
   * thresholds below, so a level can require XP, counts, or both. NULL means
   * "not XP-gated" — which is what every pre-v2 row is, so the old ladder
   * keeps resolving exactly as before.
   */
  minXp: z.number().int().min(0).nullable(),
  minRegistrations: z.number().int().min(0).nullable(),
  minFullDrops: z.number().int().min(0).nullable(),
})
export type GamificationRankLevelRule = z.infer<typeof rankLevelSchema>

const rankSchema = z.object({
  key: z.string().min(1),
  sortOrder: z.number().int(),
  name: z.string().min(1),
  description: z.string(),
  emblemUrl: z.string().nullable(),
  /** The perk this rank unlocks. Blank title = no reward at this rank. */
  rewardTitle: z.string(),
  rewardDescription: z.string(),
  rewardStatus: z.enum(RANK_REWARD_STATUSES),
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
  difficulty: z.enum(CHALLENGE_DIFFICULTIES),
  xpReward: z.number().int().min(0),
  /**
   * Collapses a family of escalating targets into ONE card in the UI (Battle-
   * Worn I..V is five rows here but one card there). NULL = standalone.
   */
  tierGroup: z.string().nullable(),
  tier: z.number().int().min(1),
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
  xpReward: z.number().int().min(0),
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
    key: z.string().min(1),
    sort_order: z.number().int(),
    name: z.string(),
    description: z.string(),
    emblem_url: z.string().nullable(),
    // v2 columns. `.catch` rather than `.optional` so a pre-migration database
    // (column absent → undefined) degrades to the neutral value instead of
    // failing the whole rules fetch and blanking the Armory.
    reward_title: z.string().catch(''),
    reward_description: z.string().catch(''),
    reward_status: z.enum(RANK_REWARD_STATUSES).catch('none'),
  }),
  rankLevel: z.object({
    rank_key: z.string().min(1),
    level: z.number().int().min(1).max(3),
    unlock_copy: z.string(),
    min_xp: z.number().int().nullable().catch(null),
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
    difficulty: z.enum(CHALLENGE_DIFFICULTIES).catch('easy'),
    xp_reward: z.number().int().catch(50),
    tier_group: z.string().nullable().catch(null),
    tier: z.number().int().catch(1),
    sort_order: z.number().int(),
    is_active: z.boolean(),
  }),
  badge: z.object({
    key: z.string(),
    title: z.string(),
    description: z.string(),
    metric: z.enum(GAMIFICATION_METRICS),
    target: z.number().int(),
    xp_reward: z.number().int().catch(0),
    sort_order: z.number().int(),
    is_active: z.boolean(),
  }),
}

function levels(
  rankKey: ArmoryRankKey,
  rows: Array<[1 | 2 | 3, string, number | null, number | null, number | null]>,
): GamificationRankLevelRule[] {
  return rows.map(([level, unlockCopy, minXp, minRegistrations, minFullDrops]) => ({
    rankKey,
    level,
    unlockCopy,
    minXp,
    minRegistrations,
    minFullDrops,
  }))
}

function rank(
  key: ArmoryRankKey,
  sortOrder: number,
  name: string,
  description: string,
  reward: [string, string, RankRewardStatus],
  levelRows: Array<[1 | 2 | 3, string, number | null, number | null, number | null]>,
): GamificationRankRule {
  return {
    key,
    sortOrder,
    name,
    description,
    emblemUrl: null,
    rewardTitle: reward[0],
    rewardDescription: reward[1],
    rewardStatus: reward[2],
    levels: levels(key, levelRows),
  }
}

function challenge(
  key: string,
  category: ChallengeCategory,
  title: string,
  description: string,
  metric: GamificationMetric,
  target: number,
  difficulty: ChallengeDifficulty,
  xpReward: number,
  tierGroup: string | null,
  tier: number,
  sortOrder: number,
): GamificationChallengeRule {
  return {
    key,
    category,
    title,
    description,
    metric,
    target,
    difficulty,
    xpReward,
    tierGroup,
    tier,
    sortOrder,
    isActive: true,
  }
}

/**
 * Offline fallback rules, used when the `gamification_*` tables are
 * unreachable (SSR before hydration, a dev environment with no Supabase).
 *
 * NOT an exact mirror of the seed any more. The v2 seed carries 51 challenge
 * rows across 20 metrics; duplicating all of them here would mean two copies
 * of an editable rule set drifting apart silently. What lives here is the
 * COMPLETE rank ladder — because a wrong rank is visible and insulting — plus
 * only those challenges resolvable from the owner's passports alone. Anything
 * needing the wear log or a counter is deliberately absent: showing a
 * permanently-0% challenge is worse than showing none.
 */
export const DEFAULT_GAMIFICATION_RULES: GamificationRules = {
  settings: {
    xpPerRegistration: 250,
    xpPerWear: 10,
    xpPerFeat: 40,
    xpPerFullDrop: 500,
    levelCurveFactor: 75,
  },
  ranks: [
    rank('unsworn', 0, 'Unsworn', 'You have crossed the threshold. Nothing has been claimed, and nothing has been proved.',
      ['', 'No reward at this rank. The forge owes you nothing yet.', 'none'], [
        [1, 'Create your account', null, null, null],
        [2, 'Read a chapter of the saga', 40, null, null],
        [3, 'Ready to swear', 80, null, null],
      ]),
    rank('initiate', 1, 'Initiate', 'The forge has noticed you. Nothing is owed to you yet.',
      ['', 'No reward at this rank. The forge owes you nothing yet.', 'none'], [
        [1, 'Claim your first passport', 100, 1, null],
        [2, 'Keep the oath', 360, null, null],
        [3, 'Prove it twice', 555, null, null],
      ]),
    rank('forged', 2, 'Forged', 'Struck, shaped, and cooled. There is steel here with your name on it.',
      ['Three free deliveries', 'Your next three orders ship free, anywhere in Lebanon.', 'coming_soon'], [
        [1, 'Struck and shaped', 750, null, null],
        [2, 'Cooling', 1250, null, null],
        [3, 'Holding its edge', 1625, null, null],
      ]),
    rank('oathbound', 3, 'Oathsworn', 'You did not buy a wardrobe. You joined a faction.',
      ['48-hour early access + a vote on the next colourway', 'Every drop opens to Oathsworn 48 hours before the public, and you get a ballot on what the next one is dyed in. The gate opens for you first.', 'coming_soon'], [
        [1, 'Sworn to the faction', 2000, null, null],
        [2, 'Answering the call', 3000, null, null],
        [3, 'Trusted with the line', 3750, null, null],
      ]),
    rank('warden', 4, 'Warden', 'You hold ground. What you have taken up, you have not put down.',
      ['10% coupon', 'A 10% discount coupon, issued once when you reach Warden.', 'coming_soon'], [
        [1, 'Given ground to hold', 4500, null, null],
        [2, 'Unmoved', 6300, null, null],
        [3, 'The border is where you stopped', 7650, null, null],
      ]),
    rank('vanguard', 5, 'Vanguard', 'You go first. The line moves when you move.',
      ['15% coupon', 'A 15% discount coupon, issued once when you reach Vanguard.', 'coming_soon'], [
        [1, 'First through the gate', 9000, null, null],
        [2, 'Moving as one body', 12600, null, null],
        [3, 'No gap between will and motion', 15300, null, null],
      ]),
    rank('warlord', 6, 'Warlord', 'Whole drops stand forged in your armory. Others measure themselves against it.',
      ['25% coupon, your name on the Hall, an engraved plate', 'A 25% coupon issued once, your name listed on the public Hall of Honor, and an engraved plate on your passport.', 'coming_soon'], [
        [1, 'Command of a full drop', 18000, null, 1],
        [2, 'Two drops answered', 26800, null, 2],
        [3, 'The host is yours', 33400, null, null],
      ]),
    rank('anvilborn', 7, 'Anvilborn', 'Struck so many times the shape is permanent. Your name is on the Anvil itself.',
      ['One piece of your choosing, free', 'Any piece, any drop, once. There is no rank above this and no second one of these.', 'coming_soon'], [
        [1, 'Named on the Anvil', 40000, null, null],
        [2, 'Struck past counting', 60000, null, null],
        [3, 'Permanent', 85000, null, null],
      ]),
  ],
  challenges: [
    challenge('first-strike', 'forge', 'First Strike', 'Claim your first passport. The oath begins the moment it is claimed.', 'registrations', 1, 'easy', 50, 'forge-claims', 1, 0),
    challenge('full-loadout', 'forge', 'Full Loadout', 'Claim three pieces.', 'registrations', 3, 'medium', 150, 'forge-claims', 2, 1),
    challenge('the-armory-1', 'forge', 'The Armory', 'Claim five pieces.', 'registrations', 5, 'medium', 150, 'forge-claims', 3, 2),
    challenge('drop-complete-1', 'forge', 'Drop Complete', 'Complete a full drop. Every division, answered.', 'full_drops', 1, 'hard', 400, 'forge-drops', 1, 3),
    challenge('first-blood', 'ritual', 'First Blood', 'Log your first wear.', 'total_wears', 1, 'easy', 50, 'ritual-wears', 1, 4),
    challenge('battle-worn-1', 'ritual', 'Battle-Worn', 'Log 25 wears across your armory.', 'total_wears', 25, 'easy', 50, 'ritual-wears', 2, 5),
    challenge('battle-worn-2', 'ritual', 'Battle-Worn II', 'Log 100 wears.', 'total_wears', 100, 'medium', 150, 'ritual-wears', 3, 6),
    challenge('devotion-1', 'ritual', 'Devotion', 'Train in a single piece 20 times.', 'max_wears', 20, 'medium', 150, 'ritual-devotion', 1, 7),
    challenge('devotion-2', 'ritual', 'Devotion II', 'Train in a single piece 50 times.', 'max_wears', 50, 'hard', 400, 'ritual-devotion', 2, 8),
    challenge('record-keeper-1', 'record', 'Record Keeper', 'Log five feats. What is not written down did not happen.', 'feat_count', 5, 'easy', 50, 'record-feats', 1, 9),
    challenge('record-keeper-2', 'record', 'Record Keeper II', 'Log twenty feats.', 'feat_count', 20, 'medium', 150, 'record-feats', 2, 10),
    challenge('curator', 'honor', 'Curator', 'Fill all three Hall of Honor slots. Choose what speaks for you.', 'honor_pinned', 3, 'medium', 150, null, 1, 11),
  ],
  badges: [
    { key: 'first-claim', title: 'First Strike', description: 'Registered your first passport. The forge has noticed you.', metric: 'registrations', target: 1, xpReward: 50, sortOrder: 0, isActive: true },
    { key: 'full-drop', title: 'Drop Complete', description: 'Every division of a drop, claimed and registered.', metric: 'full_drops', target: 1, xpReward: 400, sortOrder: 1, isActive: true },
  ],
}
