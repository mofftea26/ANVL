import type { CmsClient } from '@/app/config/clients'
import type { Drop } from '@/features/admin/drops/drops.types'
import {
  archiveDrop,
  deleteDrop,
  duplicateDrop,
  getActiveDrop,
  readDropsArray,
  scheduleDropActivation,
  setActiveDrop,
} from '@/features/admin/drops/drops.service'
import { getLandingCmsContent } from '@/features/admin/landing-cms/landingCms.service'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import type { HomePageContent } from '@/features/cms/types/cms.types'

function dropToAdminListItem(d: Drop): AdminDropListItem {
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    name: d.name,
    dropNumber: d.dropNumber,
    status: d.status,
    isActive: d.isActive,
    releaseDate: d.releaseDate,
    scheduledActivationAt: d.scheduledActivationAt,
    productCount: d.productIds.length,
    updatedAt: d.updatedAt,
    createdAt: d.createdAt,
  }
}

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
  async getAdminDropsList() {
    return readDropsArray().map(dropToAdminListItem)
  },
  async duplicateAdminDrop(id) {
    const created = duplicateDrop(id)
    return created ? dropToAdminListItem(created) : null
  },
  async setAdminActiveDrop(id) {
    setActiveDrop(id)
  },
  async scheduleAdminDrop(id, activationIso) {
    scheduleDropActivation(id, activationIso)
  },
  async archiveAdminDrop(id) {
    archiveDrop(id)
  },
  async deleteAdminDrop(id) {
    deleteDrop(id)
  },
}
