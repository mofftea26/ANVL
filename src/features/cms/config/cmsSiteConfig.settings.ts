import {
  type AssetConfig,
  type FontConfig,
  type ThemeConfig,
  assetConfigSchema,
  DEFAULT_ASSET_CONFIG,
  DEFAULT_FONT_CONFIG,
  DEFAULT_THEME_CONFIG,
  fontConfigSchema,
  parseAssetConfig,
  parseFontConfig,
  parseThemeConfig,
  themeConfigSchema,
} from '@/features/cms/config/cmsSiteConfig.zod'

export const THEME_CONFIG_STORAGE_KEY = 'anvl.themeConfig.v1'
export const FONT_CONFIG_STORAGE_KEY = 'anvl.fontConfig.v1'
export const ASSET_CONFIG_STORAGE_KEY = 'anvl.assetConfig.v1'
export const CMS_SITE_CONFIG_CHANGE_EVENT = 'anvl:cmsSiteConfig:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readJson<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
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
  window.dispatchEvent(new CustomEvent(CMS_SITE_CONFIG_CHANGE_EVENT))
}

export function readThemeConfigFromStorage(): ThemeConfig {
  return readJson(THEME_CONFIG_STORAGE_KEY, parseThemeConfig, DEFAULT_THEME_CONFIG)
}

export function writeThemeConfigToStorage(next: ThemeConfig): void {
  writeJson(THEME_CONFIG_STORAGE_KEY, themeConfigSchema.parse(next))
}

export function readFontConfigFromStorage(): FontConfig {
  return readJson(FONT_CONFIG_STORAGE_KEY, parseFontConfig, DEFAULT_FONT_CONFIG)
}

export function writeFontConfigToStorage(next: FontConfig): void {
  writeJson(FONT_CONFIG_STORAGE_KEY, fontConfigSchema.parse(next))
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

export async function saveThemeConfigAsync(next: ThemeConfig): Promise<void> {
  writeThemeConfigToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) throw new Error(sync.error)
}

export async function saveFontConfigAsync(next: FontConfig): Promise<void> {
  writeFontConfigToStorage(next)
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
