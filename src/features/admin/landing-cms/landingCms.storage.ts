import type { LandingPageCmsContent } from './landingCms.types'
import { isBrowser } from '@/shared/lib/storage/isBrowser'

export const LANDING_CMS_STORAGE_KEY = 'anvl.landingCms.v1'

export { isBrowser }

export function readLandingCmsRaw(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(LANDING_CMS_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Read legacy monolithic landing JSON (used only for one-time migration into drops).
 * Does not mutate storage on parse failure.
 */
export function readLandingCmsFromStorage(): LandingPageCmsContent | null {
  const raw = readLandingCmsRaw()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as LandingPageCmsContent
  } catch {
    return null
  }
}
