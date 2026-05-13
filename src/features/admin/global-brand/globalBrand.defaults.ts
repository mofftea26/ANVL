import { DEFAULT_EMBLEM_URL } from '@/features/admin/drops/drops.defaults'
import type { GlobalBrandSettings } from './globalBrand.types'

export function createDefaultGlobalBrandSettings(): GlobalBrandSettings {
  return {
    emblemFallbackUrl: DEFAULT_EMBLEM_URL,
    loadingEmblemFallbackUrl: DEFAULT_EMBLEM_URL,
  }
}
