import type { CmsClient } from '@/app/config/clients'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { readSiteHomepageFromStorage } from '@/features/cms/siteHomepage.settings'

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

/**
 * Browser CMS adapter — chrome (nav/announcement) reads the persisted website
 * layout; campaigns/lookbook from the site-home service. Do not import from SSR
 * entrypoints; use `seedCmsClient` via `createRuntimeClients`.
 */
export const localStorageCmsClient: CmsClient = {
  async getAnnouncementBar() {
    return announcementBarFromLayout(getWebsiteLayoutContent())
  },
  async getNavigation() {
    return getWebsiteLayoutContent().header.headerLinks
      .filter((link) => link.isVisible)
      .map((link) => ({ label: link.label, href: link.href }))
  },
  async getCampaigns() {
    const { getSiteHomeCampaigns } = await import(
      '@/features/admin/site-home/siteHome.service'
    )
    return getSiteHomeCampaigns()
  },
  async getLookbook() {
    const { getSiteHomeLookbook } = await import(
      '@/features/admin/site-home/siteHome.service'
    )
    return getSiteHomeLookbook()
  },
  async getSiteHomepage() {
    return readSiteHomepageFromStorage()
  },
}
