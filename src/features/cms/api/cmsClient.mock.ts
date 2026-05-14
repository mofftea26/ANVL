import type { CmsClient } from '@/app/config/clients'
import { getLandingCmsContent } from '@/features/admin/landing-cms/landingCms.service'
import type { Drop } from '@/features/admin/drops/drops.types'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import {
  archiveDrop,
  deleteDrop,
  duplicateDrop,
  getActiveDrop,
  getDropBySlug,
  readDropsArray,
  scheduleDropActivation,
  setActiveDrop,
} from '@/features/admin/drops/drops.service'
import { cmsMockData } from '../data/cms.mock'
import type { HomePageContent } from '../types/cms.types'

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

export const mockCmsClient: CmsClient = {
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
  async getSeoByPath(path) {
    if (path === '/') {
      const landing = getLandingCmsContent()
      return {
        title: landing.seo.title,
        description: landing.seo.description,
        canonicalPath: landing.seo.path,
        ogImage: landing.seo.ogImage,
      }
    }
    if (path.startsWith('/drop/')) {
      const slug = path.replace('/drop/', '').split('/')[0] ?? ''
      const drop = getDropBySlug(slug)
      const active = getActiveDrop()
      if (!drop || !active || drop.id !== active.id) return null
      return {
        title: drop.seo.title,
        description: drop.seo.description,
        canonicalPath: path,
        ogImage: drop.seo.ogImage,
        ogTitle: drop.seo.ogTitle,
        ogDescription: drop.seo.ogDescription,
      }
    }
    return cmsMockData.seoByPath[path] ?? null
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
