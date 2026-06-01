import type { CmsClient, SeoClient, SiteSettingsClient } from '@/app/config/clients'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import { landingCmsToLegacyHomepage } from '@/features/cms/api/cmsClient.seed'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { seedSeoResolutionContext } from '@/features/cms/api/seoClient.seed'
import {
  fetchPublishedStorefrontProjection,
} from '@/features/cms/api/publicStorefrontPublication'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import type { Drop } from '@/features/drops/drop.types'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'
import {
  DEFAULT_SITE_HOMEPAGE,
  type SiteHomepageSettings,
} from '@/features/cms/siteHomepage.settings'

export type SupabaseCmsPublicReadSlice = Pick<
  CmsClient,
  | 'getActiveDrop'
  | 'getLandingCmsContent'
  | 'getHomepageContent'
  | 'getNavigation'
  | 'getAnnouncementBar'
  | 'getCampaigns'
  | 'getLookbook'
  | 'getSiteHomepage'
>

export function createSupabaseCmsPublicReadSlice(
  env: SupabasePublicEnv,
  options: {
    landingFallback: () => LandingPageCmsContent
    activeDropFallback: () => Drop | null
  },
): SupabaseCmsPublicReadSlice {
  async function loadLandingResolved(): Promise<LandingPageCmsContent> {
    try {
      const p = await fetchPublishedStorefrontProjection(env)
      if (p)
        return composeLandingPageFromDrop(
          structuredClone(p.drop),
          structuredClone(p.layout),
        )
    } catch {
      /* missing project / network */
    }
    return structuredClone(options.landingFallback())
  }

  return {
    async getActiveDrop() {
      try {
        const p = await fetchPublishedStorefrontProjection(env)
        if (p) return structuredClone(p.drop)
      } catch {
        /* */
      }
      const d = options.activeDropFallback()
      return d ? structuredClone(d) : null
    },

    async getLandingCmsContent() {
      return loadLandingResolved()
    },

    async getHomepageContent() {
      return landingCmsToLegacyHomepage(await loadLandingResolved())
    },

    async getNavigation() {
      const landing = await loadLandingResolved()
      return landing.navigation.headerLinks
        .filter((link) => link.isVisible)
        .map((link) => ({ label: link.label, href: link.href }))
    },

    async getAnnouncementBar() {
      const landing = await loadLandingResolved()
      const a = landing.navigation.announcement
      if (a?.enabled && a.message.trim()) {
        return {
          message: a.message,
          ctaLabel: a.href?.trim() ? 'Open' : '',
          ctaHref: a.href?.trim() ?? '#',
        }
      }
      return { message: '', ctaLabel: '', ctaHref: '#' }
    },
    async getCampaigns() {
      try {
        const p = await fetchPublishedStorefrontProjection(env)
        if (p) return p.campaigns
      } catch {
        /* */
      }
      return cmsMockData.campaigns
    },
    async getLookbook() {
      try {
        const p = await fetchPublishedStorefrontProjection(env)
        if (p) return p.lookbook
      } catch {
        /* */
      }
      return cmsMockData.lookbook
    },

    async getSiteHomepage(): Promise<SiteHomepageSettings> {
      try {
        const p = await fetchPublishedStorefrontProjection(env)
        if (p) return structuredClone(p.siteHomepage)
      } catch {
        /* */
      }
      return DEFAULT_SITE_HOMEPAGE
    },
  }
}

export function createSupabaseSiteSettingsReadSlice(
  env: SupabasePublicEnv,
  layoutFallback: () => WebsiteLayoutContent,
): Pick<SiteSettingsClient, 'getWebsiteLayout'> {
  return {
    async getWebsiteLayout() {
      try {
        const p = await fetchPublishedStorefrontProjection(env)
        if (p) return structuredClone(p.layout)
      } catch {
        /* */
      }
      return structuredClone(layoutFallback())
    },
  }
}

export function createSupabaseSeoReadSlice(
  env: SupabasePublicEnv,
): Pick<SeoClient, 'getSeoByPath' | 'getSiteSeo'> {
  return {
    async getSeoByPath(path: string) {
      try {
        const p = await fetchPublishedStorefrontProjection(env)
        if (p) {
          const landing = composeLandingPageFromDrop(
            structuredClone(p.drop),
            structuredClone(p.layout),
          )
          return resolveSeoByPath(path, {
            loadLanding: () => landing,
            getActiveDrop: () => p.drop,
            getDropBySlug: (slug: string) =>
              p.drop.slug === slug ? p.drop : undefined,
          })
        }
      } catch {
        /* */
      }
      return resolveSeoByPath(path, seedSeoResolutionContext)
    },

    async getSiteSeo() {
      try {
        const p = await fetchPublishedStorefrontProjection(env)
        if (p) return p.siteSeo
      } catch {
        /* */
      }
      return defaultSiteSeoContent()
    },
  }
}
