import type { CmsClient } from '@/app/config/clients'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import { DEFAULT_SITE_HOMEPAGE } from '@/features/cms/siteHomepage.settings'
import {
  buildStaticWebsiteNavigation,
  staticHeaderNavLinks,
} from '@/features/cms/navigation/staticWebsiteNavigation'

const STATIC_NAV = buildStaticWebsiteNavigation()

function announcementBarFromStaticNav() {
  const a = STATIC_NAV.announcement
  if (a?.enabled && a.message.trim()) {
    return {
      message: a.message,
      ctaLabel: a.href?.trim() ? 'Open' : '',
      ctaHref: a.href?.trim() ?? '#',
    }
  }
  return { message: '', ctaLabel: '', ctaHref: '#' }
}

/**
 * SSR-safe storefront CMS adapter — nav/announcement from static code defaults;
 * campaigns/lookbook from mock data.
 */
export const seedCmsClient: CmsClient = {
  async getAnnouncementBar() {
    return announcementBarFromStaticNav()
  },
  async getNavigation() {
    return staticHeaderNavLinks().map((link) => ({
      label: link.label,
      href: link.href,
    }))
  },
  async getCampaigns() {
    return cmsMockData.campaigns
  },
  async getLookbook() {
    return cmsMockData.lookbook
  },
  async getSiteHomepage() {
    return structuredClone(DEFAULT_SITE_HOMEPAGE)
  },
}
