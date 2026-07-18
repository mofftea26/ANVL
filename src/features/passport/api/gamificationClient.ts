import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { restSelectList, restSelectMaybeSingle } from '@/features/cms/api/supabaseRest'

import {
  DEFAULT_GAMIFICATION_RULES,
  gamificationDbRowSchemas,
  type GamificationRankRule,
  type GamificationRules,
} from '../schemas/gamification.schema'

/**
 * Anon read of the full gamification rule set (four public tables, one
 * parallel fetch). Any failure — no Supabase env, missing migration, bad
 * rows — degrades to `DEFAULT_GAMIFICATION_RULES`, which equals the seed, so
 * behavior never regresses below the historical hardcoded rules.
 */
export async function fetchGamificationRules(): Promise<GamificationRules> {
  const env = getSupabasePublicEnv()
  if (!env) return DEFAULT_GAMIFICATION_RULES

  const [settingsRes, ranksRes, levelsRes, challengesRes, badgesRes] = await Promise.all([
    restSelectMaybeSingle(env, 'gamification_settings', 'id=eq.1&select=*'),
    restSelectList(env, 'gamification_ranks', 'select=*&order=sort_order.asc'),
    restSelectList(env, 'gamification_rank_levels', 'select=*&order=level.asc'),
    restSelectList(env, 'gamification_challenges', 'select=*&order=sort_order.asc'),
    restSelectList(env, 'gamification_badges', 'select=*&order=sort_order.asc'),
  ])

  if (
    settingsRes.error ||
    ranksRes.error ||
    levelsRes.error ||
    challengesRes.error ||
    badgesRes.error ||
    !settingsRes.data
  ) {
    return DEFAULT_GAMIFICATION_RULES
  }

  try {
    const settingsRow = gamificationDbRowSchemas.settings.parse(settingsRes.data)
    const rankRows = (ranksRes.data ?? []).map((r) => gamificationDbRowSchemas.rank.parse(r))
    const levelRows = (levelsRes.data ?? []).map((r) =>
      gamificationDbRowSchemas.rankLevel.parse(r),
    )
    const challengeRows = (challengesRes.data ?? []).map((r) =>
      gamificationDbRowSchemas.challenge.parse(r),
    )
    const badgeRows = (badgesRes.data ?? []).map((r) => gamificationDbRowSchemas.badge.parse(r))

    const ranks: GamificationRankRule[] = rankRows.map((rank) => ({
      key: rank.key,
      sortOrder: rank.sort_order,
      name: rank.name,
      description: rank.description,
      emblemUrl: rank.emblem_url,
      levels: levelRows
        .filter((level) => level.rank_key === rank.key)
        .map((level) => ({
          rankKey: level.rank_key,
          level: level.level as 1 | 2 | 3,
          unlockCopy: level.unlock_copy,
          minRegistrations: level.min_registrations,
          minFullDrops: level.min_full_drops,
        })),
    }))

    // A partially-seeded DB (no ranks/levels) falls back whole — mixing
    // DB ranks with default thresholds would derive nonsense.
    if (ranks.length === 0 || ranks.some((r) => r.levels.length === 0)) {
      return DEFAULT_GAMIFICATION_RULES
    }

    return {
      settings: {
        xpPerRegistration: settingsRow.xp_per_registration,
        xpPerWear: settingsRow.xp_per_wear,
        xpPerFeat: settingsRow.xp_per_feat,
        xpPerFullDrop: settingsRow.xp_per_full_drop,
        levelCurveFactor: settingsRow.level_curve_factor,
      },
      ranks,
      challenges: challengeRows.map((row) => ({
        key: row.key,
        category: row.category,
        title: row.title,
        description: row.description,
        metric: row.metric,
        target: row.target,
        sortOrder: row.sort_order,
        isActive: row.is_active,
      })),
      badges: badgeRows.map((row) => ({
        key: row.key,
        title: row.title,
        description: row.description,
        metric: row.metric,
        target: row.target,
        sortOrder: row.sort_order,
        isActive: row.is_active,
      })),
    }
  } catch {
    return DEFAULT_GAMIFICATION_RULES
  }
}
