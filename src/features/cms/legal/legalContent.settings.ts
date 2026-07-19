import {
  DEFAULT_LEGAL_CONTENT,
  legalContentSchema,
  parseLegalContent,
  type LegalContentConfig,
} from '@/features/cms/legal/legalContent.zod'

/**
 * localStorage-backed working copy of the legal content config, mirroring
 * `bannerConfig.settings.ts`: validated reads, a change event + cross-tab
 * `storage` listener, and an async save that write-throughs to Supabase via
 * `afterLocalCmsMutation`. Storefront-safe (SSR returns defaults).
 */

export const LEGAL_CONTENT_STORAGE_KEY = 'anvl.legalContent.v1'
export const LEGAL_CONTENT_CHANGE_EVENT = 'anvl:legalContent:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Cached snapshot: `useSyncExternalStore` requires getSnapshot to return a
// stable reference until the underlying value actually changes.
const DEFAULT_LEGAL_SNAPSHOT: LegalContentConfig = parseLegalContent(undefined)
let cachedRaw: string | null | undefined
let cachedValue: LegalContentConfig = DEFAULT_LEGAL_SNAPSHOT

export function readLegalContentFromStorage(): LegalContentConfig {
  if (!isBrowser()) return DEFAULT_LEGAL_SNAPSHOT
  let raw: string | null
  try {
    raw = window.localStorage.getItem(LEGAL_CONTENT_STORAGE_KEY)
  } catch {
    return DEFAULT_LEGAL_SNAPSHOT
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? parseLegalContent(JSON.parse(raw)) : DEFAULT_LEGAL_SNAPSHOT
  } catch {
    cachedValue = DEFAULT_LEGAL_SNAPSHOT
  }
  return cachedValue
}

export function writeLegalContentToStorage(next: LegalContentConfig): void {
  if (!isBrowser()) return
  // Validate on write so a malformed value can never be persisted.
  const safe = legalContentSchema.parse(next)
  window.localStorage.setItem(LEGAL_CONTENT_STORAGE_KEY, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent(LEGAL_CONTENT_CHANGE_EVENT))
}

export function subscribeLegalContentChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(LEGAL_CONTENT_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === LEGAL_CONTENT_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(LEGAL_CONTENT_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function saveLegalContentAsync(next: LegalContentConfig): Promise<void> {
  writeLegalContentToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation(['legal_content'])
  if (!sync.ok) throw new Error(sync.error)
}

export { DEFAULT_LEGAL_CONTENT }
