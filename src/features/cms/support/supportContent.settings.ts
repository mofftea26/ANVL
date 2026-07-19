import {
  DEFAULT_SUPPORT_CONTENT,
  parseSupportContent,
  supportContentSchema,
  type SupportContentConfig,
} from '@/features/cms/support/supportContent.zod'

/**
 * localStorage-backed working copy of the support content config, mirroring
 * `bannerConfig.settings.ts`: validated reads, a change event + cross-tab
 * `storage` listener, and an async save that write-throughs to Supabase via
 * `afterLocalCmsMutation`. Storefront-safe (SSR returns defaults).
 */

export const SUPPORT_CONTENT_STORAGE_KEY = 'anvl.supportContent.v1'
export const SUPPORT_CONTENT_CHANGE_EVENT = 'anvl:supportContent:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Cached snapshot: `useSyncExternalStore` requires getSnapshot to return a
// stable reference until the underlying value actually changes.
const DEFAULT_SUPPORT_SNAPSHOT: SupportContentConfig = parseSupportContent(undefined)
let cachedRaw: string | null | undefined
let cachedValue: SupportContentConfig = DEFAULT_SUPPORT_SNAPSHOT

export function readSupportContentFromStorage(): SupportContentConfig {
  if (!isBrowser()) return DEFAULT_SUPPORT_SNAPSHOT
  let raw: string | null
  try {
    raw = window.localStorage.getItem(SUPPORT_CONTENT_STORAGE_KEY)
  } catch {
    return DEFAULT_SUPPORT_SNAPSHOT
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? parseSupportContent(JSON.parse(raw)) : DEFAULT_SUPPORT_SNAPSHOT
  } catch {
    cachedValue = DEFAULT_SUPPORT_SNAPSHOT
  }
  return cachedValue
}

export function writeSupportContentToStorage(next: SupportContentConfig): void {
  if (!isBrowser()) return
  // Validate on write so a malformed value can never be persisted.
  const safe = supportContentSchema.parse(next)
  window.localStorage.setItem(SUPPORT_CONTENT_STORAGE_KEY, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent(SUPPORT_CONTENT_CHANGE_EVENT))
}

export function subscribeSupportContentChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(SUPPORT_CONTENT_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === SUPPORT_CONTENT_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(SUPPORT_CONTENT_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function saveSupportContentAsync(next: SupportContentConfig): Promise<void> {
  writeSupportContentToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation(['support_content'])
  if (!sync.ok) throw new Error(sync.error)
}

export { DEFAULT_SUPPORT_CONTENT }
