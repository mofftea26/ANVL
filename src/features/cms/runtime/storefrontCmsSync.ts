import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import { createDefaultWebsiteLayout } from '@/features/cms/layout/websiteLayout.defaults'
import { SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'

export function resolveStorefrontWebsiteLayout(): WebsiteLayoutContent {
  if (typeof window === 'undefined') {
    return structuredClone(SEED_WEBSITE_LAYOUT)
  }
  return createDefaultWebsiteLayout()
}
