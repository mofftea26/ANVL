import type { CmsClient } from '@/app/config/clients'
import { SEED_DROP, SEED_LANDING_PAGE_CMS } from '@/features/cms/api/seedSnapshots'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import type { HomePageContent } from '@/features/cms/types/cms.types'

function seedDropListItem(): AdminDropListItem {
  return {
    id: SEED_DROP.id,
    slug: SEED_DROP.slug,
    title: SEED_DROP.title,
    name: SEED_DROP.name,
    dropNumber: SEED_DROP.dropNumber,
    status: SEED_DROP.status,
    isActive: SEED_DROP.isActive,
    releaseDate: SEED_DROP.releaseDate,
    scheduledActivationAt: SEED_DROP.scheduledActivationAt,
    productCount: SEED_DROP.productIds.length,
    updatedAt: SEED_DROP.updatedAt,
    createdAt: SEED_DROP.createdAt,
  }
}

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
  async getAdminDropsList() {
    return [seedDropListItem()]
  },
  async duplicateAdminDrop() {
    return null
  },
  async setAdminActiveDrop() {
    /* SSR seed is read-only */
  },
  async scheduleAdminDrop() {
    /* SSR seed is read-only */
  },
  async archiveAdminDrop() {
    /* SSR seed is read-only */
  },
  async deleteAdminDrop() {
    /* SSR seed is read-only */
  },
}
