import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { getResolvedStorefrontLandingCmsSync } from '@/features/cms/runtime/storefrontCmsSync'

/**
 * Canonical homepage CMS snapshot — prefers active drop + website layout,
 * falls back to legacy landing CMS storage when drops are unavailable.
 */
export function getResolvedLandingPageCms(): LandingPageCmsContent {
  return getResolvedStorefrontLandingCmsSync()
}
