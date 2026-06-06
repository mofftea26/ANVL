import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'
import { shouldStorefrontUseLocalCmsFallback } from '@/features/cms/api/cmsPersistenceMode'

/**
 * Website layout powering the storefront chrome (header/footer nav).
 * SSR + Supabase-configured browser: seed snapshot until the publication
 * loader/hook resolves. Local-only CMS: persisted admin layout.
 */
export function resolveStorefrontWebsiteLayout(): WebsiteLayoutContent {
  if (typeof window === 'undefined') {
    return structuredClone(SEED_WEBSITE_LAYOUT)
  }
  if (!shouldStorefrontUseLocalCmsFallback()) {
    return structuredClone(SEED_WEBSITE_LAYOUT)
  }
  return getWebsiteLayoutContent()
}
