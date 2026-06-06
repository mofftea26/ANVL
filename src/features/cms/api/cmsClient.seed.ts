import type { CmsClient } from '@/app/config/clients'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import { SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import { DEFAULT_SITE_HOMEPAGE } from '@/features/cms/siteHomepage.settings'

function announcementBarFromLayout(layout: WebsiteLayoutContent) {
  const a = layout.header.announcement
  if (a?.enabled && a.message.trim()) {
    return {
      message: a.message,
      ctaLabel: a.href?.trim() ? 'Open' : '',
      ctaHref: a.href?.trim() ?? '#',
    }
  }
  return { message: '', ctaLabel: '', ctaHref: '#' }
}

function navigationFromLayout(layout: WebsiteLayoutContent) {
  return layout.header.headerLinks
    .filter((link) => link.isVisible)
    .map((link) => ({ label: link.label, href: link.href }))
}

/**
 * SSR-safe storefront CMS adapter — chrome (nav/announcement) reads from the
 * seed website layout; campaigns/lookbook from mock data. Drop-builder reads
 * were removed in the CMS teardown (see `docs/cms-teardown-plan.md`).
 */
export const seedCmsClient: CmsClient = {
  async getAnnouncementBar() {
    return announcementBarFromLayout(SEED_WEBSITE_LAYOUT)
  },
  async getNavigation() {
    return navigationFromLayout(SEED_WEBSITE_LAYOUT)
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
