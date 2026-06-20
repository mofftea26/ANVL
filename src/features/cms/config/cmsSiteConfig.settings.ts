import {
  DEFAULT_THEME_LIBRARY,
  parseThemeLibrary,
  resolveThemeConfig,
  type ThemeLibraryConfig,
} from '@/features/cms/config/themeLibrary'
import {
  DEFAULT_FONT_LIBRARY_CONFIG,
  parseFontLibrary,
  resolveFontConfig,
  type FontLibraryConfig,
} from '@/features/cms/config/fontLibrary'
import {
  assetConfigSchema,
  DEFAULT_ASSET_CONFIG,
  parseAssetConfig,
  type AssetConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'

export const THEME_CONFIG_STORAGE_KEY = 'anvl.themeConfig.v1'
export const FONT_CONFIG_STORAGE_KEY = 'anvl.fontConfig.v1'
export const ASSET_CONFIG_STORAGE_KEY = 'anvl.assetConfig.v1'
export const CMS_SITE_CONFIG_CHANGE_EVENT = 'anvl:cmsSiteConfig:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

type SnapshotCache<T> = {
  raw: string | null | undefined
  value: T
}

function createSnapshotCache<T>(
  key: string,
  parse: (raw: unknown) => T,
  fallback: T,
): { read: () => T; invalidate: () => void } {
  const cache: SnapshotCache<T> = { raw: undefined, value: fallback }

  return {
    read(): T {
      if (!isBrowser()) return fallback
      try {
        const raw = window.localStorage.getItem(key)
        if (raw === cache.raw) return cache.value
        cache.raw = raw
        cache.value = raw ? parse(JSON.parse(raw)) : fallback
        return cache.value
      } catch {
        return fallback
      }
    },
    invalidate() {
      cache.raw = undefined
    },
  }
}

const themeSnapshotCache = createSnapshotCache(
  THEME_CONFIG_STORAGE_KEY,
  (raw) => parseThemeLibrary(raw),
  DEFAULT_THEME_LIBRARY,
)
const fontSnapshotCache = createSnapshotCache(
  FONT_CONFIG_STORAGE_KEY,
  (raw) => parseFontLibrary(raw),
  DEFAULT_FONT_LIBRARY_CONFIG,
)
const assetSnapshotCache = createSnapshotCache(
  ASSET_CONFIG_STORAGE_KEY,
  parseAssetConfig,
  DEFAULT_ASSET_CONFIG,
)

function invalidateSnapshotCacheForKey(key: string): void {
  if (key === THEME_CONFIG_STORAGE_KEY) themeSnapshotCache.invalidate()
  if (key === FONT_CONFIG_STORAGE_KEY) fontSnapshotCache.invalidate()
  if (key === ASSET_CONFIG_STORAGE_KEY) assetSnapshotCache.invalidate()
}

function readJson<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
  if (key === THEME_CONFIG_STORAGE_KEY) return themeSnapshotCache.read() as T
  if (key === FONT_CONFIG_STORAGE_KEY) return fontSnapshotCache.read() as T
  if (key === ASSET_CONFIG_STORAGE_KEY) return assetSnapshotCache.read() as T

  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return parse(JSON.parse(raw))
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
  invalidateSnapshotCacheForKey(key)
  window.dispatchEvent(new CustomEvent(CMS_SITE_CONFIG_CHANGE_EVENT))
}

export function readThemeLibraryFromStorage(): ThemeLibraryConfig {
  return readJson(THEME_CONFIG_STORAGE_KEY, (raw) => parseThemeLibrary(raw), DEFAULT_THEME_LIBRARY)
}

/**
 * True when this browser has a locally-saved theme library (the admin editor
 * writes one on every save). Used by the storefront to reflect the editor's
 * own draft, so "save in CMS → see it on the storefront" always holds for the
 * editing browser. SSR-safe (always false on the server).
 */
export function hasStoredThemeLibrary(): boolean {
  if (!isBrowser()) return false
  try {
    return window.localStorage.getItem(THEME_CONFIG_STORAGE_KEY) != null
  } catch {
    return false
  }
}

export function writeThemeLibraryToStorage(next: ThemeLibraryConfig): void {
  writeJson(THEME_CONFIG_STORAGE_KEY, next)
}

/** Resolved active theme for storefront-style consumers. */
export function readThemeConfigFromStorage(): import('@/features/cms/config/cmsSiteConfig.zod').ThemeConfig {
  return resolveThemeConfig(readThemeLibraryFromStorage())
}

export function writeThemeConfigToStorage(next: ThemeLibraryConfig): void {
  writeThemeLibraryToStorage(next)
}

export function readFontLibraryFromStorage(): FontLibraryConfig {
  return readJson(FONT_CONFIG_STORAGE_KEY, (raw) => parseFontLibrary(raw), DEFAULT_FONT_LIBRARY_CONFIG)
}

export function writeFontLibraryToStorage(next: FontLibraryConfig): void {
  writeJson(FONT_CONFIG_STORAGE_KEY, next)
}

/** Resolved font family names (legacy shape). */
export function readFontConfigFromStorage(): import('@/features/cms/config/cmsSiteConfig.zod').FontConfig {
  return resolveFontConfig(readFontLibraryFromStorage())
}

export function writeFontConfigToStorage(next: FontLibraryConfig): void {
  writeFontLibraryToStorage(next)
}

export function readAssetConfigFromStorage(): AssetConfig {
  return readJson(ASSET_CONFIG_STORAGE_KEY, parseAssetConfig, DEFAULT_ASSET_CONFIG)
}

export function writeAssetConfigToStorage(next: AssetConfig): void {
  writeJson(ASSET_CONFIG_STORAGE_KEY, assetConfigSchema.parse(next))
}

export function subscribeCmsSiteConfigChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(CMS_SITE_CONFIG_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === THEME_CONFIG_STORAGE_KEY ||
      e.key === FONT_CONFIG_STORAGE_KEY ||
      e.key === ASSET_CONFIG_STORAGE_KEY
    ) {
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CMS_SITE_CONFIG_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

export async function saveThemeConfigAsync(next: ThemeLibraryConfig): Promise<void> {
  writeThemeLibraryToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) throw new Error(sync.error)
}

export async function saveFontConfigAsync(next: FontLibraryConfig): Promise<void> {
  writeFontLibraryToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) throw new Error(sync.error)
}

export async function saveAssetConfigAsync(next: AssetConfig): Promise<void> {
  writeAssetConfigToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) throw new Error(sync.error)
}
