import type { SiteSettingsClient } from '@/app/config/clients'
import { SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'

/**
 * SSR-safe site chrome snapshot (header/footer layout defaults for the oath seed).
 * TODO: replace with CMS/API-backed layout when the backend ships.
 */
export const seedSiteSettingsClient: SiteSettingsClient = {
  async getWebsiteLayout() {
    return structuredClone(SEED_WEBSITE_LAYOUT)
  },
}
