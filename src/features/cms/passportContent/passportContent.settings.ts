import {
  DEFAULT_PASSPORT_CONTENT,
  parsePassportContent,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'

/**
 * localStorage working copy of the per-product passport content map, mirroring
 * `pdpContent.settings.ts`: validated reads, a change event + cross-tab
 * `storage` listener, and an async save that write-throughs to Supabase via
 * `afterLocalCmsMutation`. SSR-safe (returns defaults on server).
 */

export const PASSPORT_CONTENT_STORAGE_KEY = 'anvl.passportContent.v1'
export const PASSPORT_CONTENT_CHANGE_EVENT = 'anvl:passportContent:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

const DEFAULT_SNAPSHOT: PassportContentConfig = { ...DEFAULT_PASSPORT_CONTENT }
let cachedRaw: string | null | undefined
let cachedValue: PassportContentConfig = DEFAULT_SNAPSHOT

export function readPassportContentFromStorage(): PassportContentConfig {
  if (!isBrowser()) return DEFAULT_SNAPSHOT
  let raw: string | null
  try {
    raw = window.localStorage.getItem(PASSPORT_CONTENT_STORAGE_KEY)
  } catch {
    return DEFAULT_SNAPSHOT
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? parsePassportContent(JSON.parse(raw)) : DEFAULT_SNAPSHOT
  } catch {
    cachedValue = DEFAULT_SNAPSHOT
  }
  return cachedValue
}

export function writePassportContentToStorage(next: PassportContentConfig): void {
  if (!isBrowser()) return
  const safe = parsePassportContent(next)
  window.localStorage.setItem(PASSPORT_CONTENT_STORAGE_KEY, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent(PASSPORT_CONTENT_CHANGE_EVENT))
}

export function subscribePassportContentChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(PASSPORT_CONTENT_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === PASSPORT_CONTENT_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(PASSPORT_CONTENT_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function savePassportContentAsync(next: PassportContentConfig): Promise<void> {
  writePassportContentToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation(['passport_content'])
  if (!sync.ok) throw new Error(sync.error)
}
