import {
  cloneLandingCmsDefaults,
  landingCmsDefaults,
} from './landingCms.defaults'
import type { LandingPageCmsContent } from './landingCms.types'
import { normalizeLandingCmsImport } from './landingCms.merge'

export { normalizeLandingCmsImport }
export { getLandingCmsContent } from '@/features/cms/landing/landingCmsRead'

export function getLandingCmsDefaults(): LandingPageCmsContent {
  return cloneLandingCmsDefaults()
}

export { landingCmsDefaults }
