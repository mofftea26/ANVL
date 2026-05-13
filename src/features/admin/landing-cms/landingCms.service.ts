import {
  cloneLandingCmsDefaults,
  landingCmsDefaults,
} from './landingCms.defaults'
import type { LandingPageCmsContent } from './landingCms.types'
import { normalizeLandingCmsImport } from './landingCms.merge'
import { getResolvedLandingPageCms } from '@/features/cms/publicLanding'

export { normalizeLandingCmsImport }

/** Resolved homepage CMS: active drop + website layout (legacy JSON migration handled elsewhere). */
export function getLandingCmsContent(): LandingPageCmsContent {
  return getResolvedLandingPageCms()
}

export function getLandingCmsDefaults(): LandingPageCmsContent {
  return cloneLandingCmsDefaults()
}

export { landingCmsDefaults }
