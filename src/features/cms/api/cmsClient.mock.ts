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
import { getAdminProductBySlug } from '@/features/admin/products/products.service'
import { cmsMockData } from '../data/cms.mock'
import type { HomePageContent, SeoContent, SeoFieldPatch } from '../types/cms.types'
import { getSiteSeoContent } from '../siteSeo.local'

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

function normalizeSeoPath(pathInput: string): string {
  const p = pathInput.trim() || '/'
  if (p === '/') return '/'
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

function applySeoPatch(base: SeoContent, patch?: SeoFieldPatch): SeoContent {
  if (!patch) return base
  let next: SeoContent = { ...base }
  for (const [key, val] of Object.entries(patch) as [keyof SeoFieldPatch, unknown][]) {
    if (val === undefined) continue
    if (typeof val === 'string' && val.trim() === '') continue
    next = { ...next, [key]: val } as SeoContent
  }
  return next
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
  async getSiteSeo() {
    return getSiteSeoContent()
  },
  async getSeoByPath(pathInput) {
    const path = normalizeSeoPath(pathInput)
    const site = getSiteSeoContent()

    if (path === '/') {
      const landing = getLandingCmsContent()
      const base: SeoContent = {
        title: landing.seo.title,
        description: landing.seo.description,
        canonicalPath: landing.seo.path || '/',
        metaTitle: landing.seo.metaTitle,
        metaDescription: landing.seo.metaDescription,
        canonicalUrl: landing.seo.canonicalUrl,
        noIndex: landing.seo.noIndex,
        ogTitle: landing.seo.ogTitle,
        ogDescription: landing.seo.ogDescription,
        ogImage: landing.seo.ogImage,
        twitterTitle: landing.seo.twitterTitle,
        twitterDescription: landing.seo.twitterDescription,
        twitterImage: landing.seo.twitterImage,
        structuredDataType: landing.seo.structuredDataType,
      }
      return applySeoPatch(base, site.staticPages['/'])
    }

    if (path.startsWith('/drop/')) {
      const slug = path.replace('/drop/', '').split('/')[0] ?? ''
      const drop = getDropBySlug(slug)
      const active = getActiveDrop()
      if (!drop || !active || drop.id !== active.id) return null
      const base: SeoContent = {
        title: drop.seo.title,
        description: drop.seo.description,
        canonicalPath: path,
        metaTitle: drop.seo.metaTitle,
        metaDescription: drop.seo.metaDescription,
        canonicalUrl: drop.seo.canonicalUrl,
        noIndex: drop.seo.noIndex,
        ogTitle: drop.seo.ogTitle,
        ogDescription: drop.seo.ogDescription,
        ogImage: drop.seo.ogImage,
        twitterTitle: drop.seo.twitterTitle,
        twitterDescription: drop.seo.twitterDescription,
        twitterImage: drop.seo.twitterImage,
        structuredDataType: drop.seo.structuredDataType,
      }
      return base
    }

    const shopMatch = path.match(/^\/shop\/([^/]+)$/)
    if (shopMatch?.[1]) {
      const slug = shopMatch[1]
      const admin = getAdminProductBySlug(slug)
      if (!admin) return null
      const base: SeoContent = {
        title: admin.seo.title ?? admin.name,
        description:
          admin.seo.description ?? admin.shortDescription ?? admin.name,
        canonicalPath: `/shop/${slug}`,
        metaTitle: admin.seo.metaTitle,
        metaDescription: admin.seo.metaDescription,
        canonicalUrl: admin.seo.canonicalUrl,
        noIndex: admin.seo.noIndex,
        ogTitle: admin.seo.ogTitle,
        ogDescription: admin.seo.ogDescription,
        ogImage: admin.seo.ogImage,
        twitterTitle: admin.seo.twitterTitle,
        twitterDescription: admin.seo.twitterDescription,
        twitterImage: admin.seo.twitterImage,
        structuredDataType: admin.seo.structuredDataType,
      }
      return base
    }

    const seed = cmsMockData.seoByPath[path]
    if (seed) {
      const patch =
        path === '/shop' || path === '/about' || path === '/size-guide'
          ? site.staticPages[path]
          : undefined
      return applySeoPatch(seed, patch)
    }

    return null
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
