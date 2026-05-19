import { createDefaultGlobalBrandSettings } from './globalBrand.defaults'
import type { GlobalBrandSettings } from './globalBrand.types'
import {
  readGlobalBrandRaw,
  writeGlobalBrandRaw,
  isBrowser,
} from './globalBrand.storage'
import { persistedGlobalBrandSchema } from './globalBrand.persistence.zod'

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
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return createDefaultGlobalBrandSettings()
  }
  // SEC-07 — Zod-validate before merge so tampered blobs cannot drive
  // the admin runtime. mergeStored still runs to apply the
  // empty-string -> default normalization for URL fields.
  const result = persistedGlobalBrandSchema.safeParse(parsed)
  if (!result.success) return createDefaultGlobalBrandSettings()
  return mergeStored(result.data)
}

export function saveGlobalBrandSettings(
  next: GlobalBrandSettings,
): GlobalBrandSettings {
  const stamped = mergeStored(next)
  writeGlobalBrandRaw(JSON.stringify(stamped))
  if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
    void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
      m.scheduleAdminCmsRemoteSync(),
    )
  }
  return stamped
}
