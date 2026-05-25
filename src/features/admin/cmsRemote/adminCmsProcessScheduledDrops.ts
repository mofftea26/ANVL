import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { flushAdminCmsRemoteSync } from '@/features/admin/cmsRemote/adminCmsRemoteSync'
import { publishStorefrontDropByClientId } from '@/features/admin/cmsRemote/adminCmsPublish'

export type ProcessDueScheduledDropsResult =
  | { ok: true; processedCount: number; slugs: string[] }
  | { ok: false; error: string }

type DueDropRow = {
  id: string
  slug: string
  client_drop_id?: string | null
  scheduled_activation_at?: string | null
}

/**
 * Publishes every drop that is still `scheduled` with `scheduled_activation_at <= now`.
 * Mirrors what `cms_process_scheduled_drops` does, but callable from the admin browser session.
 */
export async function processDueScheduledDropsRemote(): Promise<ProcessDueScheduledDropsResult> {
  if (!getSupabasePublicEnv()) {
    return { ok: true, processedCount: 0, slugs: [] }
  }

  const flush = await flushAdminCmsRemoteSync()
  if (!flush.ok) return flush

  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Supabase client is not available.' }
  }

  const { role } = await fetchCmsProfileRole(client)
  if (role !== 'admin') {
    return { ok: false, error: 'Only CMS admins can process scheduled drops.' }
  }

  const nowIso = new Date().toISOString()
  const { data, error } = await client
    .from('anvl_drops')
    .select('id, slug, client_drop_id, scheduled_activation_at')
    .eq('status', 'scheduled')
    .not('scheduled_activation_at', 'is', null)
    .lte('scheduled_activation_at', nowIso)

  if (error) return { ok: false, error: error.message }

  const dueRows = (data ?? []) as DueDropRow[]
  const slugs: string[] = []

  for (const row of dueRows) {
    const clientDropId =
      typeof row.client_drop_id === 'string' && row.client_drop_id.trim()
        ? row.client_drop_id.trim()
        : row.id

    const published = await publishStorefrontDropByClientId(clientDropId)
    if (!published.ok) return published
    slugs.push(row.slug)
  }

  return { ok: true, processedCount: slugs.length, slugs }
}
