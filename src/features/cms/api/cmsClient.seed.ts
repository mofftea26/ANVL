import type { CmsClient } from '@/app/config/clients'
import { SEED_DROP } from '@/features/cms/api/seedSnapshots'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import {
  getResolvedStorefrontLandingCmsSync,
  resolveStorefrontActiveDrop,
} from '@/features/cms/runtime/storefrontCmsSync'
import { adminDropListVisualsFromDrop } from '@/features/admin/drops/adminDropListItemVisuals'
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
    ...adminDropListVisualsFromDrop(SEED_DROP),
  }
}

export function landingCmsToLegacyHomepage(
  landing: LandingPageCmsContent,
): HomePageContent {
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
    const d = resolveStorefrontActiveDrop()
    return d ? structuredClone(d) : structuredClone(SEED_DROP)
  },
  async getLandingCmsContent() {
    return structuredClone(getResolvedStorefrontLandingCmsSync())
  },
  async getHomepageContent() {
    return landingCmsToLegacyHomepage(getResolvedStorefrontLandingCmsSync())
  },
  async getAnnouncementBar() {
    return cmsMockData.announcementBar
  },
  async getNavigation() {
    return getResolvedStorefrontLandingCmsSync().navigation.headerLinks
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
  async deactivateAdminDrop() {
    /* SSR seed is read-only */
  },
  async scheduleAdminDrop() {
    /* SSR seed is read-only */
  },
  async deleteAdminDrop() {
    /* SSR seed is read-only */
  },
}
