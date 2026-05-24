import type { Drop } from '@/features/admin/drops/drops.types'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { buildAnvlDropRemoteRow } from '@/features/admin/cmsRemote/adminCmsDropRemoteRow'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

export type InsertAnvlDropResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Inserts one draft row into `public.anvl_drops` immediately (used by
 * `/admin/drops/new` so hydration cannot overwrite a local-only draft).
 */
export async function insertAnvlDropToSupabase(
  drop: Drop,
): Promise<InsertAnvlDropResult> {
  if (!getSupabasePublicEnv()) return { ok: true }

  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Supabase client is not available.' }
  }

  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) {
    return { ok: false, error: 'Not signed in.' }
  }

  const { role } = await fetchCmsProfileRole(client)
  if (role !== 'admin') {
    return { ok: false, error: 'Admin CMS role required to create drops.' }
  }

  const row = buildAnvlDropRemoteRow(drop)

  const { data: existing, error: selErr } = await client
    .from('anvl_drops')
    .select('id')
    .eq('client_drop_id', drop.id)
    .maybeSingle()

  if (selErr) return { ok: false, error: selErr.message }
  if (existing?.id) return { ok: true }

  const { error: insErr } = await client.from('anvl_drops').insert(row)
  if (insErr) return { ok: false, error: insErr.message }

  return { ok: true }
}
