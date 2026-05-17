import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { getActiveDrop, ensureDropSystemHydrated } from '@/features/cms/read/dropRuntime'
import {
  getWebsiteLayoutContent,
  normalizeLandingCmsImport,
  readLandingCmsFromStorage,
} from '@/features/cms/read/landingCmsRuntime'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'

/**
 * Canonical homepage CMS snapshot — prefers active drop + website layout,
 * falls back to legacy landing CMS storage when drops are unavailable.
 */
export function getResolvedLandingPageCms(): LandingPageCmsContent {
  ensureDropSystemHydrated()
  const active = getActiveDrop()
  const layout = getWebsiteLayoutContent()

  if (!active) {
    return normalizeLandingCmsImport(readLandingCmsFromStorage())
  }

  return composeLandingPageFromDrop(active, layout)
}
