import {
  DEFAULT_COMING_SOON_CONFIG,
  comingSoonConfigSchema,
  parseComingSoonConfig,
  type ComingSoonConfig,
} from '@/features/cms/comingSoon/comingSoon.zod'

/**
 * localStorage-backed working copy of the Coming Soon config, following the
 * same shape as `shopExperience.settings.ts`: validated reads, a change event +
 * cross-tab `storage` listener, and an async save that write-throughs to
 * Supabase via `afterLocalCmsMutation`. Storefront-safe (SSR returns defaults).
 */

export const COMING_SOON_STORAGE_KEY = 'anvl.comingSoon.v1'
export const COMING_SOON_CHANGE_EVENT = 'anvl:comingSoon:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Cached snapshot: `useSyncExternalStore` requires getSnapshot to return a
// stable reference until the underlying value actually changes.
const DEFAULT_COMING_SOON_SNAPSHOT: ComingSoonConfig = parseComingSoonConfig(undefined)
let cachedRaw: string | null | undefined
let cachedValue: ComingSoonConfig = DEFAULT_COMING_SOON_SNAPSHOT

export function readComingSoonConfigFromStorage(): ComingSoonConfig {
  if (!isBrowser()) return DEFAULT_COMING_SOON_SNAPSHOT
  let raw: string | null
  try {
    raw = window.localStorage.getItem(COMING_SOON_STORAGE_KEY)
  } catch {
    return DEFAULT_COMING_SOON_SNAPSHOT
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw
      ? parseComingSoonConfig(JSON.parse(raw))
      : DEFAULT_COMING_SOON_SNAPSHOT
  } catch {
    cachedValue = DEFAULT_COMING_SOON_SNAPSHOT
  }
  return cachedValue
}

export function writeComingSoonConfigToStorage(next: ComingSoonConfig): void {
  if (!isBrowser()) return
  // Validate on write so a malformed value can never be persisted.
  const safe = comingSoonConfigSchema.parse(next)
  window.localStorage.setItem(COMING_SOON_STORAGE_KEY, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent(COMING_SOON_CHANGE_EVENT))
}

export function subscribeComingSoonConfigChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(COMING_SOON_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === COMING_SOON_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(COMING_SOON_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function saveComingSoonConfigAsync(
  next: ComingSoonConfig,
): Promise<void> {
  writeComingSoonConfigToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation(['coming_soon'])
  if (!sync.ok) throw new Error(sync.error)
}

export { DEFAULT_COMING_SOON_CONFIG }
