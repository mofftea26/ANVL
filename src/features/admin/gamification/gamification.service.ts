import type { SupabaseClient } from '@supabase/supabase-js'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { fetchGamificationRules } from '@/features/passport/api/gamificationClient'
import type {
  ArmoryRankKey,
  ChallengeCategory,
  GamificationMetric,
  GamificationRules,
  GamificationXpSettings,
} from '@/features/passport/schemas/gamification.schema'

export type GamificationResult<T> = { ok: true; data: T } | { ok: false; error: string }

function client(): GamificationResult<SupabaseClient> {
  const c = getAdminSupabaseBrowserClient()
  if (!c) return { ok: false, error: 'Sign in to manage gamification.' }
  return { ok: true, data: c }
}

function fail(error: { message?: string } | null, fallback: string): { ok: false; error: string } {
  return { ok: false, error: error?.message ?? fallback }
}

/** Admin read = the same anon rules fetch (rules are public data). */
export async function loadGamificationRules(): Promise<GamificationRules> {
  return fetchGamificationRules()
}

export interface RankDraft {
  key: ArmoryRankKey
  name: string
  description: string
  emblemUrl: string | null
  levels: Array<{
    level: 1 | 2 | 3
    unlockCopy: string
    minRegistrations: number | null
    minFullDrops: number | null
  }>
}

/** Update one rank's copy/emblem + its three level thresholds. */
export async function saveRank(draft: RankDraft): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data

  const rankRes = await supabase
    .from('gamification_ranks')
    .update({
      name: draft.name,
      description: draft.description,
      emblem_url: draft.emblemUrl,
    })
    .eq('key', draft.key)
  if (rankRes.error) return fail(rankRes.error, 'Could not save the rank.')

  for (const level of draft.levels) {
    const levelRes = await supabase
      .from('gamification_rank_levels')
      .update({
        unlock_copy: level.unlockCopy,
        min_registrations: level.minRegistrations,
        min_full_drops: level.minFullDrops,
      })
      .eq('rank_key', draft.key)
      .eq('level', level.level)
    if (levelRes.error) return fail(levelRes.error, 'Could not save a rank level.')
  }
  return { ok: true, data: null }
}

export interface ChallengeDraft {
  key: string
  category: ChallengeCategory
  title: string
  description: string
  metric: GamificationMetric
  target: number
  sortOrder: number
  isActive: boolean
}

export async function upsertChallenge(
  draft: ChallengeDraft,
): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data.from('gamification_challenges').upsert(
    {
      key: draft.key,
      category: draft.category,
      title: draft.title,
      description: draft.description,
      metric: draft.metric,
      target: draft.target,
      sort_order: draft.sortOrder,
      is_active: draft.isActive,
    },
    { onConflict: 'key' },
  )
  if (res.error) return fail(res.error, 'Could not save the challenge.')
  return { ok: true, data: null }
}

export async function deleteChallenge(key: string): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data.from('gamification_challenges').delete().eq('key', key)
  if (res.error) return fail(res.error, 'Could not delete the challenge.')
  return { ok: true, data: null }
}

/** Persist the whole challenge order after a drag-reorder. */
export async function saveChallengeOrder(
  orderedKeys: string[],
): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  for (const [index, key] of orderedKeys.entries()) {
    const res = await c.data
      .from('gamification_challenges')
      .update({ sort_order: index })
      .eq('key', key)
    if (res.error) return fail(res.error, 'Could not save the challenge order.')
  }
  return { ok: true, data: null }
}

export interface BadgeDraft {
  key: string
  title: string
  description: string
  metric: GamificationMetric
  target: number
  sortOrder: number
  isActive: boolean
}

export async function upsertBadge(draft: BadgeDraft): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data.from('gamification_badges').upsert(
    {
      key: draft.key,
      title: draft.title,
      description: draft.description,
      metric: draft.metric,
      target: draft.target,
      sort_order: draft.sortOrder,
      is_active: draft.isActive,
    },
    { onConflict: 'key' },
  )
  if (res.error) return fail(res.error, 'Could not save the badge.')
  return { ok: true, data: null }
}

export async function deleteBadge(key: string): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data.from('gamification_badges').delete().eq('key', key)
  if (res.error) return fail(res.error, 'Could not delete the badge.')
  return { ok: true, data: null }
}

export async function saveXpSettings(
  settings: GamificationXpSettings,
): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data
    .from('gamification_settings')
    .update({
      xp_per_registration: settings.xpPerRegistration,
      xp_per_wear: settings.xpPerWear,
      xp_per_feat: settings.xpPerFeat,
      xp_per_full_drop: settings.xpPerFullDrop,
      level_curve_factor: settings.levelCurveFactor,
    })
    .eq('id', 1)
  if (res.error) return fail(res.error, 'Could not save XP settings.')
  return { ok: true, data: null }
}
