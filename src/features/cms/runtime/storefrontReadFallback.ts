import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Drop } from '@/features/drops/drop.types'
import {
  getResolvedStorefrontLandingCmsSync,
  resolveStorefrontActiveDrop,
} from '@/features/cms/runtime/storefrontCmsSync'

/**
 * Fallback landing CMS when Supabase fetch fails or env is unset.
 * With Supabase configured: seed snapshot (never admin localStorage drafts).
 * Local-only CMS: active drop + layout from admin persistence.
 */
export function getStorefrontOfflineLandingCms(): LandingPageCmsContent {
  return getResolvedStorefrontLandingCmsSync()
}

/** Active drop for publication fetch fallbacks — see {@link resolveStorefrontActiveDrop}. */
export function getStorefrontOfflineActiveDrop(): Drop | null {
  return resolveStorefrontActiveDrop()
}
