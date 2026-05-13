import { createDefaultGlobalBrandSettings } from './globalBrand.defaults'
import type { GlobalBrandSettings } from './globalBrand.types'
import {
  readGlobalBrandRaw,
  writeGlobalBrandRaw,
  isBrowser,
} from './globalBrand.storage'

function mergeStored(raw: Partial<GlobalBrandSettings> | null): GlobalBrandSettings {
  const defaults = createDefaultGlobalBrandSettings()
  if (!raw || typeof raw !== 'object') return defaults
  return {
    ...defaults,
    ...raw,
    emblemFallbackUrl:
      typeof raw.emblemFallbackUrl === 'string' && raw.emblemFallbackUrl.trim()
        ? raw.emblemFallbackUrl.trim()
        : defaults.emblemFallbackUrl,
    loadingEmblemFallbackUrl:
      typeof raw.loadingEmblemFallbackUrl === 'string' &&
      raw.loadingEmblemFallbackUrl.trim()
        ? raw.loadingEmblemFallbackUrl.trim()
        : defaults.loadingEmblemFallbackUrl,
  }
}

export function getGlobalBrandSettings(): GlobalBrandSettings {
  if (!isBrowser()) return createDefaultGlobalBrandSettings()
  const raw = readGlobalBrandRaw()
  if (!raw) return createDefaultGlobalBrandSettings()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object')
      return createDefaultGlobalBrandSettings()
    return mergeStored(parsed as Partial<GlobalBrandSettings>)
  } catch {
    return createDefaultGlobalBrandSettings()
  }
}

export function saveGlobalBrandSettings(
  next: GlobalBrandSettings,
): GlobalBrandSettings {
  const stamped = mergeStored(next)
  writeGlobalBrandRaw(JSON.stringify(stamped))
  return stamped
}
