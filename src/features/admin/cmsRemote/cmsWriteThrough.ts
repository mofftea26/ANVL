import type {
  AdminCmsFlushResult,
  CmsSettingsFieldKey,
} from '@/features/admin/cmsRemote/adminCmsRemoteSync'

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
): Promise<AdminCmsFlushResult> {
  const { flushAdminCmsRemoteSync } = await import(
    '@/features/admin/cmsRemote/adminCmsRemoteSync'
  )
  return flushAdminCmsRemoteSync(fields)
}

/**
 * After a local mutation: push to Supabase when configured and not hydrating.
 *
 * Legacy-shaped result for the `save*Async` callers: benign skips (tests, SSR,
 * no Supabase env, hydration pull in progress) stay `ok: true`; everything the
 * flush reports as an error — no session, non-writable role, failed/0-row
 * writes — becomes `ok: false`, which every `save*Async` throws on, so editors
 * toast the real failure instead of a false "Saved."
 */
export async function afterLocalCmsMutation(
  fields?: CmsSettingsFieldKey[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await flushAdminCmsWriteThrough(fields)
  if (result.status === 'error') return { ok: false, error: result.message }
  return { ok: true }
}
