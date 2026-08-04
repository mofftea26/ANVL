import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  DEFAULT_PDP_CONTENT,
  parsePdpContent,
  type PdpContentConfig,
} from '@/features/cms/pdpContent/pdpContent.zod'

/**
 * localStorage working copy of the per-product PDP content map, following the
 * `shopExperience.settings.ts` shape: validated reads, a change event +
 * cross-tab `storage` listener, and an async save that write-throughs to
 * Supabase via `afterLocalCmsMutation`. SSR-safe (returns defaults on server).
 */

export const PDP_CONTENT_STORAGE_KEY = 'anvl.pdpContent.v1'
export const PDP_CONTENT_CHANGE_EVENT = 'anvl:pdpContent:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Cached snapshot: `useSyncExternalStore` requires getSnapshot to return a
// stable reference until the underlying value actually changes — otherwise it
// re-renders every tick (infinite loop). We cache by the raw localStorage
// string and only re-parse when it differs.
const DEFAULT_PDP_CONTENT_SNAPSHOT: PdpContentConfig = { ...DEFAULT_PDP_CONTENT }
let cachedRaw: string | null | undefined
let cachedValue: PdpContentConfig = DEFAULT_PDP_CONTENT_SNAPSHOT

export function readPdpContentFromStorage(): PdpContentConfig {
  if (!isBrowser()) return DEFAULT_PDP_CONTENT_SNAPSHOT
  let raw: string | null
  try {
    raw = window.localStorage.getItem(PDP_CONTENT_STORAGE_KEY)
  } catch {
    return DEFAULT_PDP_CONTENT_SNAPSHOT
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? parsePdpContent(JSON.parse(raw)) : DEFAULT_PDP_CONTENT_SNAPSHOT
  } catch {
    cachedValue = DEFAULT_PDP_CONTENT_SNAPSHOT
  }
  return cachedValue
}

export function hasStoredPdpContent(): boolean {
  if (!isBrowser()) return false
  try {
    return window.localStorage.getItem(PDP_CONTENT_STORAGE_KEY) != null
  } catch {
    return false
  }
}

export function writePdpContentToStorage(next: PdpContentConfig): void {
  if (!isBrowser()) return
  const safe = parsePdpContent(next)
  window.localStorage.setItem(PDP_CONTENT_STORAGE_KEY, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent(PDP_CONTENT_CHANGE_EVENT))
}

export function subscribePdpContentChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(PDP_CONTENT_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === PDP_CONTENT_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(PDP_CONTENT_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * Refuse to publish a whole-map snapshot this browser never loaded.
 *
 * `pdp_content` is one jsonb map keyed by product slug, and every save
 * publishes the ENTIRE map. A browser that never hydrated it (fresh machine,
 * incognito, cleared site data, `/admin/settings` local reset, or a hydration
 * pull that failed) reads `{}`, so the editor's `{ ...stored, [slug]: draft }`
 * merge produces a one-product map — and saving it erases every other
 * product's content in `cms_settings` and in the anon-readable
 * `storefront_publication` mirror at once.
 *
 * The check must happen BEFORE the local write: by the time the flush runs,
 * `writePdpContentToStorage` has already created the key, so the same probe
 * there would always pass. That is also why this is EXPORTED rather than kept
 * private to `savePdpContentAsync` — a caller that writes storage itself and
 * flushes separately (the techpack auto-import does exactly that, so it can
 * tell a deferred publish from a successful one) would otherwise walk straight
 * past both this guard and the flush's. Any such caller must call this first.
 *
 * The flush carries the matching guard for the unscoped auto-sync path (see
 * `WholeMapColumn` in `adminCmsRemoteSync.ts` for the full rationale, incl.
 * why this hard-fails rather than hydrating first or silently skipping).
 */
export function assertPdpContentHydrated(): void {
  // Only meaningful when Supabase is the authority: with no remote projection
  // there is no published map to clobber and no hydration step to wait for.
  if (!getSupabasePublicEnv()) return
  if (hasStoredPdpContent()) return
  throw new Error(
    'Product content has not loaded from Supabase in this browser yet — saving now ' +
      "would erase every other product's content. Reload /admin and try again.",
  )
}

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function savePdpContentAsync(next: PdpContentConfig): Promise<void> {
  assertPdpContentHydrated()
  writePdpContentToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation(['pdp_content'])
  if (!sync.ok) throw new Error(sync.error)
}
