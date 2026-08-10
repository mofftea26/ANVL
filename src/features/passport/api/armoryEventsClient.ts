import { z } from 'zod'

/**
 * Armory event recording + the counter read.
 *
 * Every countable action in the app funnels through `recordArmoryEvent`, which
 * appends one row to `armory_events`. Counters are then derived server-side by
 * `get_armory_counters` rather than kept as running totals, so a miscount can
 * always be repaired by re-reading history instead of hunting a drifted
 * integer.
 *
 * Recording is FIRE-AND-FORGET by design. Logging a share must never be able
 * to fail a share, and a dropped analytics row is worth far less than a broken
 * primary action — so every write swallows its error and returns a boolean the
 * caller is free to ignore.
 */

export const ARMORY_EVENT_TYPES = [
  'passport_claimed',
  'wear_logged',
  'feat_logged',
  'feat_published',
  'review_written',
  'share_sent',
  'chapter_read',
  'armory_published',
  'honor_pinned',
  'passport_transferred_out',
  'passport_transferred_in',
] as const
export type ArmoryEventType = (typeof ARMORY_EVENT_TYPES)[number]

/**
 * Counters that cannot be derived from the owner's passport rows in the
 * browser. Mirrors the `get_armory_counters` payload.
 *
 * Every field is `.default(0).catch(0)`, and BOTH halves are load-bearing:
 * `.catch` covers a present-but-wrong-typed value, while `.default` covers a
 * MISSING key — a `.catch` alone does not fire on absence. Without the
 * default, `parse({})` throws, which is exactly how `EMPTY_ARMORY_COUNTERS`
 * below took a whole test suite down at import time.
 */
export const armoryCountersSchema = z.object({
  streakDays: z.number().int().default(0).catch(0),
  weeklyStreak: z.number().int().default(0).catch(0),
  distinctMonths: z.number().int().default(0).catch(0),
  earlyWears: z.number().int().default(0).catch(0),
  shares: z.number().int().default(0).catch(0),
  chaptersRead: z.number().int().default(0).catch(0),
  armoryViews: z.number().int().default(0).catch(0),
  transfersOut: z.number().int().default(0).catch(0),
  transfersIn: z.number().int().default(0).catch(0),
  reviews: z.number().int().default(0).catch(0),
  publicFeats: z.number().int().default(0).catch(0),
  tenureDays: z.number().int().default(0).catch(0),
  armoryPublic: z.number().int().default(0).catch(0),
  distinctColorways: z.number().int().default(0).catch(0),
  divisionsOwned: z.number().int().default(0).catch(0),
})
export type ArmoryCounters = z.infer<typeof armoryCountersSchema>

export const EMPTY_ARMORY_COUNTERS: ArmoryCounters = armoryCountersSchema.parse({})

async function getAuthedClient() {
  if (typeof window === 'undefined') return null
  const { getStorefrontSupabaseClient } = await import(
    '@/features/storefront-account/auth/storefrontSupabaseClient'
  )
  return getStorefrontSupabaseClient()
}

/**
 * Append one event. Returns whether it landed; callers may ignore it.
 *
 * `passportId` is verified against the caller's ownership inside the RPC, so
 * passing one the caller does not own fails there rather than writing a row
 * attributed to the wrong armory.
 */
export async function recordArmoryEvent(input: {
  type: ArmoryEventType
  passportId?: string | null
  targetId?: string | null
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  try {
    const supabase = await getAuthedClient()
    if (!supabase) return false
    const { data, error } = await supabase.rpc('record_armory_event', {
      p_event_type: input.type,
      p_passport_id: input.passportId ?? null,
      p_target_id: input.targetId ?? null,
      p_metadata: input.metadata ?? {},
    })
    if (error) return false
    return Boolean((data as { ok?: boolean } | null)?.ok)
  } catch {
    return false
  }
}

/**
 * Record a view of someone else's public armory. Anon-callable: the RPC
 * resolves the handle to its owner, ignores self-views, and dedupes to one per
 * owner per day so a refresh loop cannot inflate the number.
 */
export async function recordArmoryView(handle: string): Promise<boolean> {
  try {
    const supabase = await getAuthedClient()
    if (!supabase) return false
    const { data, error } = await supabase.rpc('record_armory_view', { p_handle: handle })
    if (error) return false
    return Boolean((data as { counted?: boolean } | null)?.counted)
  } catch {
    return false
  }
}

/** Every server-derived counter in one round trip. */
export async function fetchArmoryCounters(): Promise<ArmoryCounters> {
  try {
    const supabase = await getAuthedClient()
    if (!supabase) return EMPTY_ARMORY_COUNTERS
    const { data, error } = await supabase.rpc('get_armory_counters')
    if (error || !data) return EMPTY_ARMORY_COUNTERS
    const row = data as Record<string, unknown>
    if (row.ok !== true) return EMPTY_ARMORY_COUNTERS
    return armoryCountersSchema.parse(row)
  } catch {
    return EMPTY_ARMORY_COUNTERS
  }
}
