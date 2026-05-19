import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Drop } from '@/features/drops/drop.types'
import {
  getResolvedStorefrontLandingCmsSync,
  resolveStorefrontActiveDrop,
} from '@/features/cms/runtime/storefrontCmsSync'

/**
 * Storefront CMS when Supabase is unset, offline, or has no published snapshot.
 * Browser: active drop + layout from local admin persistence (same as pre-Supabase).
 * SSR: deterministic seed snapshot.
 */
export function getStorefrontOfflineLandingCms(): LandingPageCmsContent {
  return getResolvedStorefrontLandingCmsSync(
    typeof window === 'undefined' ? { forceSsrSnapshot: true } : undefined,
  )
}

/** Active drop for offline / unpublished fallback — seed on SSR, localStorage in browser. */
export function getStorefrontOfflineActiveDrop(): Drop | null {
  return resolveStorefrontActiveDrop()
}
