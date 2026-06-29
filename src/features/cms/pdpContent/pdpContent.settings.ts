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

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function savePdpContentAsync(next: PdpContentConfig): Promise<void> {
  writePdpContentToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) throw new Error(sync.error)
}
