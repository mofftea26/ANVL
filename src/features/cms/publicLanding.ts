import { composeLandingPageFromDrop } from '@/features/admin/drops/drops.compose'
import {
  ensureDropSystemHydrated,
  getActiveDrop,
} from '@/features/admin/drops/drops.service'
import {
  normalizeLandingCmsImport,
} from '@/features/admin/landing-cms/landingCms.merge'
import { readLandingCmsFromStorage } from '@/features/admin/landing-cms/landingCms.storage'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
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
