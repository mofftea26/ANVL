import { z } from 'zod'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { flushAdminCmsRemoteSync } from '@/features/admin/cmsRemote/adminCmsRemoteSync'

const publishRpcResultSchema = z.object({
  revision: z.union([z.number(), z.string()]),
  publishedAt: z.string().optional(),
  dropId: z.string().uuid().optional(),
})

export type PublishStorefrontDropResult =
  | { ok: true; revision: number }
  | { ok: false; error: string }

/**
 * Pushes local drafts, resolves the server row by app `Drop.id`, then runs
 * `cms_publish_drop` so anonymous storefront reads see the new snapshot.
 */
export async function publishStorefrontDropByClientId(
  clientDropId: string,
): Promise<PublishStorefrontDropResult> {
  if (!getSupabasePublicEnv()) {
    return { ok: true, revision: 0 }
  }

  const flush = await flushAdminCmsRemoteSync()
  if (!flush.ok) return flush

  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Supabase client is not available.' }
  }

  const { role } = await fetchCmsProfileRole(client)
  if (role !== 'admin') {
    return { ok: false, error: 'Only CMS admins can publish to the storefront.' }
  }

  const trimmedId = clientDropId.trim()
  if (!trimmedId) {
    return { ok: false, error: 'Drop id is required to publish.' }
  }

  const { data: row, error: selErr } = await client
    .from('anvl_drops')
    .select('id')
    .eq('client_drop_id', trimmedId)
    .maybeSingle()

  if (selErr) return { ok: false, error: selErr.message }
  if (!row?.id) {
    return {
      ok: false,
      error:
        'Drop was not found in Supabase. Save the drop and try again, or check client_drop_id sync.',
    }
  }

  const { data, error } = await client.rpc('cms_publish_drop', {
    p_drop_id: row.id,
  })

  if (error) return { ok: false, error: error.message }

  const parsed = publishRpcResultSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: 'Publish succeeded but returned an unexpected payload.' }
  }

  const revRaw = parsed.data.revision
  const revision =
    typeof revRaw === 'number'
      ? revRaw
      : Number.parseInt(String(revRaw), 10) || 0

  return { ok: true, revision }
}

export type ClearStorefrontActiveDropResult =
  | { ok: true }
  | { ok: false; error: string }

/** Clears `storefront_publication.active_drop_id` so no campaign is live. */
export async function clearStorefrontActiveDrop(): Promise<ClearStorefrontActiveDropResult> {
  if (!getSupabasePublicEnv()) {
    return { ok: true }
  }

  const flush = await flushAdminCmsRemoteSync()
  if (!flush.ok) return flush

  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Supabase client is not available.' }
  }

  const { role } = await fetchCmsProfileRole(client)
  if (role !== 'admin') {
    return { ok: false, error: 'Only CMS admins can update the live storefront.' }
  }

  const { error } = await client
    .from('storefront_publication')
    .update({ active_drop_id: null })
    .eq('id', 1)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
