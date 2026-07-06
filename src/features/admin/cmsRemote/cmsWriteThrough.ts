import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { isAdminCmsRemoteHydrationLocked } from '@/features/admin/cmsRemote/adminCmsRemoteGate'
import type { CmsSettingsFieldKey } from '@/features/admin/cmsRemote/adminCmsRemoteSync'

const isTestRunner = import.meta.env.MODE === 'test'

/**
 * Immediately flush local admin CMS state to Supabase (no debounce).
 * Used after explicit Save actions when Supabase is the authority.
 *
 * @param fields Pass the single (or few) `cms_settings` column(s) this save
 * actually changed, so the write is scoped to just that column — leaving it
 * `undefined` falls back to syncing every tracked field from the local
 * snapshot (see `adminCmsRemoteSync.ts`'s `flushAdminCmsRemoteSync`).
 */
export async function flushAdminCmsWriteThrough(
  fields?: CmsSettingsFieldKey[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { flushAdminCmsRemoteSync } = await import(
    '@/features/admin/cmsRemote/adminCmsRemoteSync'
  )
  return flushAdminCmsRemoteSync(fields)
}

/** After a local mutation: push to Supabase when configured and not hydrating. */
export async function afterLocalCmsMutation(
  fields?: CmsSettingsFieldKey[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isTestRunner) return { ok: true }
  if (typeof window === 'undefined') return { ok: true }
  if (!getSupabasePublicEnv()) return { ok: true }
  if (isAdminCmsRemoteHydrationLocked()) return { ok: true }
  return flushAdminCmsWriteThrough(fields)
}
