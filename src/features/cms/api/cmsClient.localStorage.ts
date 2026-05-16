import type { CmsClient } from '@/app/config/clients'
import { getActiveDrop } from '@/features/admin/drops/drops.service'
import { getLandingCmsContent } from '@/features/admin/landing-cms/landingCms.service'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import type { HomePageContent } from '@/features/cms/types/cms.types'

function toLegacyHomepage(): HomePageContent {
  const landing = getLandingCmsContent()
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
 * Browser CMS adapter — reads persisted admin/editor state from localStorage-backed services.
 * Do not import this module from SSR entrypoints; use `seedCmsClient` via `createRuntimeClients`.
 * TODO: replace with authenticated CMS/API client when the backend ships.
 */
export const localStorageCmsClient: CmsClient = {
  async getActiveDrop() {
    return getActiveDrop()
  },
  async getLandingCmsContent() {
    return getLandingCmsContent()
  },
  async getHomepageContent() {
    return toLegacyHomepage()
  },
  async getAnnouncementBar() {
    return cmsMockData.announcementBar
  },
  async getNavigation() {
    const landing = getLandingCmsContent()
    return landing.navigation.headerLinks
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
