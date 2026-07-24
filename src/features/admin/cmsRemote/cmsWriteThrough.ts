import {
  flushAdminCmsRemoteSync,
  type AdminCmsFlushResult,
  type CmsSettingsFieldKey,
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
  // NOTE: this MUST be a static import (not `await import(...)`). Reaching
  // `adminCmsRemoteSync` only through a dynamic import nested inside this
  // (already dynamically-imported) module made Rolldown/Vite tree-shake the
  // whole module out of the CLIENT build — the emitted dynamic import then
  // resolved `flushAdminCmsRemoteSync` to `undefined`, so every admin Save
  // threw "n is not a function" in production. `cmsWriteThrough` is itself
  // only ever `await import()`-ed by the `save*Async` functions, so a static
  // edge here keeps the admin write code in that same lazy chunk (never the
  // storefront entry) while giving the bundler a reference it won't drop.
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
