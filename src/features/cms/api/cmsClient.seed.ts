import type { CmsClient } from '@/app/config/clients'
import { SEED_DROP, SEED_LANDING_PAGE_CMS } from '@/features/cms/api/seedSnapshots'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import type { HomePageContent } from '@/features/cms/types/cms.types'

function toLegacyHomepage(landing: typeof SEED_LANDING_PAGE_CMS): HomePageContent {
  return {
    hero: {
      title: landing.hero.title,
      subtitle: landing.hero.subtitle,
      primaryCta: landing.hero.primaryCta,
      secondaryCta: landing.hero.secondaryCta,
    },
    manifesto: {
      heading: landing.manifesto.heading,
      lines: landing.manifesto.tenets
        .filter((tenet) => tenet.isVisible)
        .map((tenet) => tenet.text),
    },
    materials: landing.materials.materials
      .filter((material) => material.isVisible)
      .map((material) => ({
        title: material.title,
        description: material.description,
      })),
  }
}

/**
 * SSR-safe storefront CMS adapter — static oath drop + composed landing snapshot.
 * TODO: replace with CMS/API-backed implementation when the backend ships.
 */
export const seedCmsClient: CmsClient = {
  async getActiveDrop() {
    return structuredClone(SEED_DROP)
  },
  async getLandingCmsContent() {
    return structuredClone(SEED_LANDING_PAGE_CMS)
  },
  async getHomepageContent() {
    return toLegacyHomepage(SEED_LANDING_PAGE_CMS)
  },
  async getAnnouncementBar() {
    return cmsMockData.announcementBar
  },
  async getNavigation() {
    return SEED_LANDING_PAGE_CMS.navigation.headerLinks
      .filter((link) => link.isVisible)
      .map((link) => ({ label: link.label, href: link.href }))
  },
  async getCampaigns() {
    return cmsMockData.campaigns
  },
  async getLookbook() {
    return cmsMockData.lookbook
  },
}
