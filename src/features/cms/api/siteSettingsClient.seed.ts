import type { SiteSettingsClient } from '@/app/config/clients'
import { SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'

/**
 * SSR-safe site chrome snapshot (header/footer layout defaults for the oath seed).
 *
 * TODO(cms, low): make nav/footer layout CMS-editable. Currently intentional —
 * CLAUDE.md's CMS Rules state "Nav/footer/SEO use code defaults, not
 * CMS-editable", so this seed IS the contract today. Only revisit if that rule
 * changes.
 */
export const seedSiteSettingsClient: SiteSettingsClient = {
  async getWebsiteLayout() {
    return structuredClone(SEED_WEBSITE_LAYOUT)
  },
}
