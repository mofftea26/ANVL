import {
  DEFAULT_SHOP_CONFIG,
  parseShopConfig,
  shopConfigSchema,
  type ShopConfig,
} from '@/features/cms/shop/shopExperience.zod'

/**
 * localStorage-backed working copy of the Shop Experience config, following the
 * same shape as `cmsSiteConfig.settings.ts`: validated reads, a change event +
 * cross-tab `storage` listener, and an async save that write-throughs to
 * Supabase via `afterLocalCmsMutation`. Storefront-safe (SSR returns defaults).
 */

export const SHOP_CONFIG_STORAGE_KEY = 'anvl.shopConfig.v1'
export const SHOP_CONFIG_CHANGE_EVENT = 'anvl:shopConfig:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Cached snapshot: `useSyncExternalStore` requires getSnapshot to return a
// stable reference until the underlying value actually changes — otherwise it
// re-renders every tick (infinite loop). We cache by the raw localStorage
// string and only re-parse when it differs.
const DEFAULT_SHOP_CONFIG_SNAPSHOT: ShopConfig = parseShopConfig(undefined)
let cachedRaw: string | null | undefined
let cachedValue: ShopConfig = DEFAULT_SHOP_CONFIG_SNAPSHOT

export function readShopConfigFromStorage(): ShopConfig {
  if (!isBrowser()) return DEFAULT_SHOP_CONFIG_SNAPSHOT
  let raw: string | null
  try {
    raw = window.localStorage.getItem(SHOP_CONFIG_STORAGE_KEY)
  } catch {
    return DEFAULT_SHOP_CONFIG_SNAPSHOT
  }
  if (raw === cachedRaw) return cachedValue
  cachedRaw = raw
  try {
    cachedValue = raw ? parseShopConfig(JSON.parse(raw)) : DEFAULT_SHOP_CONFIG_SNAPSHOT
  } catch {
    cachedValue = DEFAULT_SHOP_CONFIG_SNAPSHOT
  }
  return cachedValue
}

/** True when this browser has a locally-saved shop config (editor draft). */
export function hasStoredShopConfig(): boolean {
  if (!isBrowser()) return false
  try {
    return window.localStorage.getItem(SHOP_CONFIG_STORAGE_KEY) != null
  } catch {
    return false
  }
}

export function writeShopConfigToStorage(next: ShopConfig): void {
  if (!isBrowser()) return
  // Validate on write so a malformed value can never be persisted.
  const safe = shopConfigSchema.parse(next)
  window.localStorage.setItem(SHOP_CONFIG_STORAGE_KEY, JSON.stringify(safe))
  window.dispatchEvent(new CustomEvent(SHOP_CONFIG_CHANGE_EVENT))
}

export function subscribeShopConfigChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(SHOP_CONFIG_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === SHOP_CONFIG_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(SHOP_CONFIG_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Save + write-through to Supabase (when configured). Throws on sync error. */
export async function saveShopConfigAsync(next: ShopConfig): Promise<void> {
  writeShopConfigToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) throw new Error(sync.error)
}

export { DEFAULT_SHOP_CONFIG }
