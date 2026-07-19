import {
  DEFAULT_BANNER_CONFIG,
  bannerConfigSchema,
  parseBannerConfig,
  type BannerConfig,
} from '@/features/cms/banner/bannerConfig.zod'

/**
 * localStorage-backed working copy of the announcement banner config,
 * mirroring `comingSoon.settings.ts`: validated reads, a change event +
 * cross-tab `storage` listener, and an async save that write-throughs to
 * Supabase via `afterLocalCmsMutation`. Storefront-safe (SSR returns defaults).
 */

export const BANNER_CONFIG_STORAGE_KEY = 'anvl.bannerConfig.v1'
export const BANNER_CONFIG_CHANGE_EVENT = 'anvl:bannerConfig:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Cached snapshot: `useSyncExternalStore` requires getSnapshot to return a
// stable reference until the underlying value actually changes.
const DEFAULT_BANNER_SNAPSHOT: BannerConfig = parseBannerConfig(undefined)
let cachedRaw: string | null | undefined
let cachedValue: BannerConfig = DEFAULT_BANNER_SNAPSHOT

export function readBannerConfigFromStorage(): BannerConfig {
  if (!isBrowser()) return DEFAULT_BANNER_SNAPSHOT
  let raw: string | null
  try {
    raw = window.localStorage.getItem(BANNER_CONFIG_STORAGE_KEY)
  } catch {
    return DEFAULT_BANNER_SNAPSHOT
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? parseBannerConfig(JSON.parse(raw)) : DEFAULT_BANNER_SNAPSHOT
  } catch {
    cachedValue = DEFAULT_BANNER_SNAPSHOT
  }
  return cachedValue
}

export function writeBannerConfigToStorage(next: BannerConfig): void {
  if (!isBrowser()) return
  // Validate on write so a malformed value can never be persisted.
  const safe = bannerConfigSchema.parse(next)
  window.localStorage.setItem(BANNER_CONFIG_STORAGE_KEY, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent(BANNER_CONFIG_CHANGE_EVENT))
}

export function subscribeBannerConfigChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(BANNER_CONFIG_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === BANNER_CONFIG_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(BANNER_CONFIG_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function saveBannerConfigAsync(next: BannerConfig): Promise<void> {
  writeBannerConfigToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation(['banner_config'])
  if (!sync.ok) throw new Error(sync.error)
}

export { DEFAULT_BANNER_CONFIG }
