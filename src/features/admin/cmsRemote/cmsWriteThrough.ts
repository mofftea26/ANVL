import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { isAdminCmsRemoteHydrationLocked } from '@/features/admin/cmsRemote/adminCmsRemoteGate'

const isTestRunner = import.meta.env.MODE === 'test'

/**
 * Immediately flush local admin CMS state to Supabase (no debounce).
 * Used after explicit Save actions when Supabase is the authority.
 */
export async function flushAdminCmsWriteThrough(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const { flushAdminCmsRemoteSync } = await import(
    '@/features/admin/cmsRemote/adminCmsRemoteSync'
  )
  return flushAdminCmsRemoteSync()
}

/** After a local mutation: push to Supabase when configured and not hydrating. */
export async function afterLocalCmsMutation(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isTestRunner) return { ok: true }
  if (typeof window === 'undefined') return { ok: true }
  if (!getSupabasePublicEnv()) return { ok: true }
  if (isAdminCmsRemoteHydrationLocked()) return { ok: true }
  return flushAdminCmsWriteThrough()
}
