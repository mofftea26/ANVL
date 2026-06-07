import type { SiteSettingsClient } from '@/app/config/clients'
import { createDefaultWebsiteLayout } from '@/features/cms/layout/websiteLayout.defaults'

export const localStorageSiteSettingsClient: SiteSettingsClient = {
  async getWebsiteLayout() {
    return createDefaultWebsiteLayout()
  },
}
