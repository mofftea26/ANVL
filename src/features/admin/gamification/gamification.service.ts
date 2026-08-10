import type { SupabaseClient } from '@supabase/supabase-js'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { fetchGamificationRules } from '@/features/passport/api/gamificationClient'
import type {
  ArmoryRankKey,
  ChallengeCategory,
  ChallengeDifficulty,
  GamificationMetric,
  GamificationRules,
  GamificationXpSettings,
  RankRewardStatus,
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
  /** The perk this rank unlocks. Blank title = no reward at this rank. */
  rewardTitle: string
  rewardDescription: string
  rewardStatus: RankRewardStatus
  levels: Array<{
    level: 1 | 2 | 3
    unlockCopy: string
    /** Forge XP threshold — the primary gate since gamification v2. */
    minXp: number | null
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
      reward_title: draft.rewardTitle,
      reward_description: draft.rewardDescription,
      reward_status: draft.rewardStatus,
    })
    .eq('key', draft.key)
  if (rankRes.error) return fail(rankRes.error, 'Could not save the rank.')

  for (const level of draft.levels) {
    const levelRes = await supabase
      .from('gamification_rank_levels')
      .update({
        unlock_copy: level.unlockCopy,
        min_xp: level.minXp,
        min_registrations: level.minRegistrations,
        min_full_drops: level.minFullDrops,
      })
      .eq('rank_key', draft.key)
      .eq('level', level.level)
    if (levelRes.error) return fail(levelRes.error, 'Could not save a rank level.')
  }
  return { ok: true, data: null }
}

export interface CreateRankInput {
  name: string
  description?: string
  emblemUrl?: string | null
}

function slugifyRankKey(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'rank'
  )
}

/**
 * Create a rank: generated slug key (de-duplicated against existing keys),
 * appended to the ladder (`sort_order` = max + 1), with its three level rows
 * created in the same flow. Level thresholds start EMPTY (null = "not
 * required") per the audited decision — the admin sets real thresholds in the
 * editor; until then the derivation can hand the new top rank to everyone, so
 * the editor surfaces that hint next to threshold fields.
 * Returns the generated key.
 */
export async function createRank(
  input: CreateRankInput,
): Promise<GamificationResult<string>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data

  const name = input.name.trim()
  if (!name) return { ok: false, error: 'The rank needs a name.' }

  const existing = await supabase
    .from('gamification_ranks')
    .select('key, sort_order')
  if (existing.error) return fail(existing.error, 'Could not read the rank ladder.')
  const rows = (existing.data ?? []) as Array<{ key: string; sort_order: number }>

  const taken = new Set(rows.map((row) => row.key))
  const base = slugifyRankKey(name)
  let key = base
  for (let n = 2; taken.has(key); n += 1) key = `${base}-${n}`

  const sortOrder = rows.reduce((max, row) => Math.max(max, row.sort_order), -1) + 1

  const rankRes = await supabase.from('gamification_ranks').insert({
    key,
    sort_order: sortOrder,
    name,
    description: input.description?.trim() ?? '',
    emblem_url: input.emblemUrl?.trim() || null,
  })
  if (rankRes.error) return fail(rankRes.error, 'Could not create the rank.')

  const roman = ['I', 'II', 'III'] as const
  const levelRes = await supabase.from('gamification_rank_levels').insert(
    ([1, 2, 3] as const).map((level) => ({
      rank_key: key,
      level,
      unlock_copy: `Ascend to ${name} ${roman[level - 1]}`,
      // No thresholds at all on a freshly created rank: an admin sets them
      // next. Leaving min_xp null means the new rank is reachable immediately,
      // which is the same permissive behaviour the count columns always had.
      min_xp: null,
      min_registrations: null,
      min_full_drops: null,
    })),
  )
  if (levelRes.error) {
    // Best-effort rollback so a half-created rank never lingers.
    await supabase.from('gamification_ranks').delete().eq('key', key)
    return fail(levelRes.error, 'Could not create the rank levels.')
  }

  return { ok: true, data: key }
}

/**
 * Delete a rank (its level rows cascade). Refuses to delete the last rank —
 * the derivation needs at least one floor level to land on.
 */
export async function deleteRank(key: string): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data

  const count = await supabase
    .from('gamification_ranks')
    .select('key', { count: 'exact', head: true })
  if (count.error) return fail(count.error, 'Could not read the rank ladder.')
  if ((count.count ?? 0) <= 1) {
    return { ok: false, error: 'The ladder needs at least one rank — cannot delete the last one.' }
  }

  const res = await supabase.from('gamification_ranks').delete().eq('key', key)
  if (res.error) return fail(res.error, 'Could not delete the rank.')
  return { ok: true, data: null }
}

/** Persist the whole ladder order (index = sort_order). */
export async function saveRankOrder(
  orderedKeys: string[],
): Promise<GamificationResult<null>> {
  const c = client()
  if (!c.ok) return c
  for (const [index, key] of orderedKeys.entries()) {
    const res = await c.data
      .from('gamification_ranks')
      .update({ sort_order: index })
      .eq('key', key)
    if (res.error) return fail(res.error, 'Could not save the rank order.')
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
  difficulty: ChallengeDifficulty
  /** XP awarded on completion. Priced per challenge, not derived from band. */
  xpReward: number
  /** Shared key that collapses escalating targets into one UI card. */
  tierGroup: string | null
  tier: number
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
      difficulty: draft.difficulty,
      xp_reward: draft.xpReward,
      tier_group: draft.tierGroup,
      tier: draft.tier,
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
