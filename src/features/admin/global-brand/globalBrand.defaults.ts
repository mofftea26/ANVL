import type { GlobalBrandSettings } from './globalBrand.types'

/** ANVL emblem fallback used when no published brand emblem is set. */
const DEFAULT_EMBLEM_URL = '/brand/the-oath-shape.svg'

export function createDefaultGlobalBrandSettings(): GlobalBrandSettings {
  return {
    emblemFallbackUrl: DEFAULT_EMBLEM_URL,
    loadingEmblemFallbackUrl: DEFAULT_EMBLEM_URL,
  }
}
