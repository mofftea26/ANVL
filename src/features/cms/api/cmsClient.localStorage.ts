import type { CmsClient } from '@/app/config/clients'
import type { Drop } from '@/features/drops/drop.types'
import {
  deleteDrop,
  duplicateDrop,
  readDropsArray,
  scheduleDropActivation,
  deactivateDrop,
  setActiveDrop,
} from '@/features/admin/drops/drops.service'
import { getLandingCmsContent } from '@/features/admin/landing-cms/landingCms.service'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import type { HomePageContent } from '@/features/cms/types/cms.types'
import { resolveStorefrontActiveDrop } from '@/features/cms/runtime/storefrontCmsSync'
import { adminDropListVisualsFromDrop } from '@/features/admin/drops/adminDropListItemVisuals'

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
    ...adminDropListVisualsFromDrop(d),
  }
}

/** Push local drop mutations to Supabase before the list refetches remote rows. */
async function flushAdminCmsToSupabaseIfConfigured(): Promise<void> {
  const { getSupabasePublicEnv } = await import(
    '@/features/cms/api/supabasePublicEnv'
  )
  if (!getSupabasePublicEnv()) return
  const { flushAdminCmsRemoteSync } = await import(
    '@/features/admin/cmsRemote/adminCmsRemoteSync'
  )
  const result = await flushAdminCmsRemoteSync()
  if (!result.ok) {
    throw new Error(result.error)
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
    return resolveStorefrontActiveDrop()
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
  async getAdminDropsList() {
    return readDropsArray().map(dropToAdminListItem)
  },
  async duplicateAdminDrop(id) {
    const created = duplicateDrop(id)
    if (!created) return null
    await flushAdminCmsToSupabaseIfConfigured()
    return dropToAdminListItem(created)
  },
  async setAdminActiveDrop(id) {
    setActiveDrop(id)
    const { publishStorefrontDropByClientId } = await import(
      '@/features/admin/cmsRemote/adminCmsPublish'
    )
    const published = await publishStorefrontDropByClientId(id)
    if (!published.ok) {
      throw new Error(published.error)
    }
    const { rehydrateAdminCmsFromRemote } = await import(
      '@/features/admin/cmsRemote/rehydrateAdminCmsFromRemote'
    )
    await rehydrateAdminCmsFromRemote()
  },
  async deactivateAdminDrop(id) {
    deactivateDrop(id)
    const { clearStorefrontActiveDrop } = await import(
      '@/features/admin/cmsRemote/adminCmsPublish'
    )
    const cleared = await clearStorefrontActiveDrop()
    if (!cleared.ok) {
      throw new Error(cleared.error)
    }
    const { rehydrateAdminCmsFromRemote } = await import(
      '@/features/admin/cmsRemote/rehydrateAdminCmsFromRemote'
    )
    await rehydrateAdminCmsFromRemote()
  },
  async scheduleAdminDrop(id, activationIso) {
    scheduleDropActivation(id, activationIso)
    await flushAdminCmsToSupabaseIfConfigured()
  },
  async deleteAdminDrop(id) {
    deleteDrop(id)
    await flushAdminCmsToSupabaseIfConfigured()
  },
}
