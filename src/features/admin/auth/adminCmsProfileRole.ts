import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const cmsRoleSchema = z.enum(['viewer', 'editor', 'admin'])

export type CmsProfileRole = z.infer<typeof cmsRoleSchema>

export type CmsProfileRoleFetch = {
  role: CmsProfileRole | null
  /** PostgREST / Postgres error when reading `cms_profiles` (e.g. RLS). */
  selectError: string | null
}

/**
 * Human-readable reason when `/admin` access is denied after Supabase Auth.
 */
export function formatCmsAdminAccessDeniedReason(
  fetch: CmsProfileRoleFetch,
  userId?: string,
): string {
  const idHint =
    userId != null
      ? ` Your Auth user id is ${userId} — use it as cms_profiles.user_id in Supabase SQL.`
      : ''
  if (fetch.selectError) {
    return `Could not read your CMS profile (${fetch.selectError}). Check that RLS on public.cms_profiles allows SELECT where auth.uid() = user_id.${idHint}`
  }
  if (fetch.role === 'editor' || fetch.role === 'viewer') {
    return 'This account is not an ANVL CMS admin (editor/viewer roles cannot open /admin). Ask an owner to set cms_profiles.role to admin for your user_id.'
  }
  return (
    'No admin CMS role found for this account. In Supabase SQL Editor run: ' +
    `INSERT INTO public.cms_profiles (user_id, role) VALUES ('${userId ?? '<your-auth-user-id>'}', 'admin') ` +
    'ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;' +
    idHint
  )
}

/**
 * Reads `public.cms_profiles.role` for the current (or explicitly passed)
 * Supabase Auth user. Callers that already have `user.id` from a session or
 * `signInWithPassword` should pass it so we query `cms_profiles` immediately
 * without an extra `getUser()` round-trip.
 */
function parseCmsProfileRoleRow(
  data: unknown,
): CmsProfileRoleFetch {
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object' || !('role' in row)) {
    return { role: null, selectError: null }
  }
  const roleValue = (row as { role: unknown }).role
  if (typeof roleValue !== 'string') {
    return { role: null, selectError: null }
  }
  const normalized = roleValue.trim().toLowerCase()
  const parsed = cmsRoleSchema.safeParse(normalized)
  if (!parsed.success) {
    return { role: null, selectError: null }
  }
  return { role: parsed.data, selectError: null }
}

/**
 * Reads `cms_profiles` via PostgREST with an explicit JWT so login does not
 * block on GoTrue `getSession` (same storage key can hang while bootstrap runs).
 */
export async function fetchCmsProfileRoleWithAccessToken(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
  userId: string,
): Promise<CmsProfileRoleFetch> {
  const base = supabaseUrl.replace(/\/$/, '')
  const params = new URLSearchParams({
    select: 'role',
    user_id: `eq.${userId}`,
  })
  const res = await fetch(`${base}/rest/v1/cms_profiles?${params}`, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    let message = res.statusText || `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { message?: string; error?: string }
      message = body.message ?? body.error ?? message
    } catch {
      /* use statusText */
    }
    return { role: null, selectError: message }
  }
  const data: unknown = await res.json()
  return parseCmsProfileRoleRow(data)
}

export async function fetchCmsProfileRole(
  client: SupabaseClient,
  authenticatedUserId?: string,
): Promise<CmsProfileRoleFetch> {
  let userId = authenticatedUserId
  if (!userId) {
    const { data: userData, error: userErr } = await client.auth.getUser()
    if (userErr || !userData.user) {
      return { role: null, selectError: userErr?.message ?? null }
    }
    userId = userData.user.id
  }

  const { data, error } = await client
    .from('cms_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return { role: null, selectError: error.message }
  }
  return parseCmsProfileRoleRow(data)
}
