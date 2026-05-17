import { getResolvedLandingPageCms } from '@/features/cms/publicLanding'
import type { LandingPageCmsContent } from './landingPageCms.types'

/** Resolved homepage CMS for loaders and hooks (Phase D — storefront entry). */
export function getLandingCmsContent(): LandingPageCmsContent {
  return getResolvedLandingPageCms()
}
