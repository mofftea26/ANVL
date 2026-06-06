import { z } from 'zod'
import {
  DEFAULT_LANDING_PAGE_KEY,
  resolveActiveLandingPageKey,
} from '@/features/landingPages/registry'

/**
 * Active code-owned landing page key — the one piece of CMS state the new model
 * uses to drive the public home route.
 *
 * Mirrors the `siteHomepage.settings.ts` pattern: a local store for instant
 * admin preview + cross-tab sync, flushed to `storefront_publication`
 * (`active_landing_page_key`) and `cms_settings` on save. Reads are
 * storefront-safe; the async write path dynamically imports the admin sync
 * module (code-split — never in the storefront chunk).
 */

export const ACTIVE_LANDING_PAGE_STORAGE_KEY = 'anvl.activeLandingPage.v1'
export const ACTIVE_LANDING_PAGE_CHANGE_EVENT = 'anvl:activeLandingPage:change'

export type ActiveLandingPageSettings = {
  key: string
  updatedAt: string
}

const schema = z.object({
  key: z.string(),
  updatedAt: z.string(),
})

export const DEFAULT_ACTIVE_LANDING_PAGE: ActiveLandingPageSettings = {
  key: DEFAULT_LANDING_PAGE_KEY,
  updatedAt: '',
}

/** Parse + clamp the stored key to a valid registry key (else the default). */
export function parseActiveLandingPageSettings(
  raw: unknown,
): ActiveLandingPageSettings {
  const r = schema.safeParse(raw)
  if (!r.success) return DEFAULT_ACTIVE_LANDING_PAGE
  return { ...r.data, key: resolveActiveLandingPageKey(r.data.key) }
}

export function parseActiveLandingPageUnknown(
  raw: unknown,
): ActiveLandingPageSettings {
  if (raw == null) return DEFAULT_ACTIVE_LANDING_PAGE
  return parseActiveLandingPageSettings(raw)
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readActiveLandingPageFromStorage(): ActiveLandingPageSettings {
  if (!isBrowser()) return DEFAULT_ACTIVE_LANDING_PAGE
  try {
    const raw = window.localStorage.getItem(ACTIVE_LANDING_PAGE_STORAGE_KEY)
    if (!raw) return DEFAULT_ACTIVE_LANDING_PAGE
    return parseActiveLandingPageSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_ACTIVE_LANDING_PAGE
  }
}

export function writeActiveLandingPageToStorage(
  next: ActiveLandingPageSettings,
): void {
  if (!isBrowser()) return
  window.localStorage.setItem(
    ACTIVE_LANDING_PAGE_STORAGE_KEY,
    JSON.stringify(next),
  )
  window.dispatchEvent(
    new CustomEvent(ACTIVE_LANDING_PAGE_CHANGE_EVENT, { detail: next }),
  )
}

export function subscribeActiveLandingPageChange(
  listener: () => void,
): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(ACTIVE_LANDING_PAGE_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === ACTIVE_LANDING_PAGE_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(ACTIVE_LANDING_PAGE_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Local-only write + scheduled background flush to Supabase (fire-and-forget). */
export function setActiveLandingPageKey(
  rawKey: string,
): ActiveLandingPageSettings {
  const next: ActiveLandingPageSettings = {
    key: resolveActiveLandingPageKey(rawKey),
    updatedAt: new Date().toISOString(),
  }
  writeActiveLandingPageToStorage(next)
  if (import.meta.env.MODE !== 'test') {
    void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
      m.scheduleAdminCmsRemoteSync(),
    )
  }
  return next
}

/** Persist locally, then flush to `storefront_publication` + `cms_settings`. */
export async function saveActiveLandingPageKeyAsync(
  rawKey: string,
): Promise<ActiveLandingPageSettings> {
  const next: ActiveLandingPageSettings = {
    key: resolveActiveLandingPageKey(rawKey),
    updatedAt: new Date().toISOString(),
  }
  writeActiveLandingPageToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) {
    throw new Error(sync.error)
  }
  return next
}

/**
 * Loader-side read of the active key. Supabase publication when configured
 * (single coalesced round-trip), else the default. Validation against the
 * registry happens at render via `resolveLandingPage`.
 */
export async function readActiveLandingPageKeyForLoader(): Promise<string> {
  const { getSupabasePublicEnv } = await import(
    '@/features/cms/api/supabasePublicEnv'
  )
  const env = getSupabasePublicEnv()
  if (!env) return DEFAULT_LANDING_PAGE_KEY
  try {
    const { fetchPublishedStorefrontProjection } = await import(
      '@/features/cms/api/publicStorefrontPublication'
    )
    const projection = await fetchPublishedStorefrontProjection(env)
    if (projection) return projection.activeLandingPageKey
  } catch {
    /* missing project / network — fall through */
  }
  return DEFAULT_LANDING_PAGE_KEY
}
