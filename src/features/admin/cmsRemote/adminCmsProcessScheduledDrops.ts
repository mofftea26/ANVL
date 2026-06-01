import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { flushAdminCmsRemoteSync } from '@/features/admin/cmsRemote/adminCmsRemoteSync'
import { publishRpcResultSchema } from '@/features/admin/cmsRemote/adminCmsPublish'

export type ProcessDueScheduledDropsResult =
  | { ok: true; processedCount: number; slugs: string[] }
  | { ok: false; error: string }

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
  const { data: rows, error: selErr } = await client
    .from('anvl_drops')
    .select('id, slug, scheduled_activation_at')
    .eq('status', 'scheduled')
    .not('scheduled_activation_at', 'is', null)
    .lte('scheduled_activation_at', nowIso)

  if (selErr) return { ok: false, error: selErr.message }

  const due = rows ?? []
  const slugs: string[] = []

  for (const row of due) {
    const { data, error } = await client.rpc('cms_publish_drop', {
      p_drop_id: row.id,
    })
    if (error) return { ok: false, error: error.message }

    const parsed = publishRpcResultSchema.safeParse(data)
    if (!parsed.success) {
      return { ok: false, error: 'Publish succeeded but returned an unexpected payload.' }
    }

    if (typeof row.slug === 'string' && row.slug.trim()) {
      slugs.push(row.slug.trim())
    }
  }

  return { ok: true, processedCount: due.length, slugs }
}
