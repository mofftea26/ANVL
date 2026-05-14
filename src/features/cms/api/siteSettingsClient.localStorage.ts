import type { SiteSettingsClient } from '@/app/config/clients'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'

/**
 * Browser site layout — reads `ANVL_WEBSITE_LAYOUT` and merges with defaults.
 * TODO: replace with CMS/API-backed layout when the backend ships.
 */
export const localStorageSiteSettingsClient: SiteSettingsClient = {
  async getWebsiteLayout() {
    return getWebsiteLayoutContent()
  },
}
