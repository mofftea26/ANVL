import { z } from 'zod'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'

/**
 * Typed client for the `admin_search_profiles` RPC
 * (supabase/migrations/20260720101000_admin_search_profiles.sql).
 *
 * CMS-side customer lookup — prefix-matches full name / armory handle / email
 * and returns safe projection rows only (never emails/addresses back out).
 * The RPC itself enforces the cms_profiles editor/admin gate; a plain
 * customer session gets a Postgres exception, surfaced here as `ok: false`.
 *
 * Consumed by the story cast picker (assign a real athlete to a chapter's
 * cast) and reusable by future admin people-pickers.
 */

const adminProfileSearchRowSchema = z.object({
  user_id: z.uuid(),
  full_name: z.string().nullable().default(''),
  armory_handle: z.string().nullable().default(null),
  claim_count: z.number().int().nonnegative().default(0),
})

export interface AdminProfileSearchHit {
  userId: string
  fullName: string
  armoryHandle: string | null
  /** Number of product passports registered to this athlete. */
  claimCount: number
}

export type SearchAdminProfilesResult =
  | { ok: true; hits: AdminProfileSearchHit[] }
  | { ok: false; error: string }

export async function searchAdminProfiles(
  query: string,
): Promise<SearchAdminProfilesResult> {
  const trimmed = query.trim()
  if (!trimmed) return { ok: true, hits: [] }

  const client = getAdminSupabaseBrowserClient()
  if (!client) return { ok: false, error: 'Sign in to search athletes.' }

  const { data, error } = await client.rpc('admin_search_profiles', {
    p_query: trimmed,
  })
  if (error) return { ok: false, error: error.message }

  const rows = z.array(adminProfileSearchRowSchema).safeParse(data ?? [])
  if (!rows.success) {
    return { ok: false, error: 'Unexpected response from admin_search_profiles.' }
  }

  return {
    ok: true,
    hits: rows.data.map((row) => ({
      userId: row.user_id,
      fullName: (row.full_name ?? '').trim(),
      armoryHandle: row.armory_handle,
      claimCount: row.claim_count,
    })),
  }
}
