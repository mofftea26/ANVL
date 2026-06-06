import type { CmsClient, SeoClient, SiteSettingsClient } from '@/app/config/clients'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { fetchPublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'
import {
  DEFAULT_SITE_HOMEPAGE,
  type SiteHomepageSettings,
} from '@/features/cms/siteHomepage.settings'

export type SupabaseCmsPublicReadSlice = Pick<
  CmsClient,
  'getNavigation' | 'getAnnouncementBar' | 'getCampaigns' | 'getLookbook' | 'getSiteHomepage'
>

export function createSupabaseCmsPublicReadSlice(
  env: SupabasePublicEnv,
  options: {
    layoutFallback: () => WebsiteLayoutContent
  },
): SupabaseCmsPublicReadSlice {
  async function loadLayout(): Promise<WebsiteLayoutContent> {
    try {
      const p = await fetchPublishedStorefrontProjection(env)
      if (p) return p.layout
    } catch {
      /* missing project / network */
    }
    return options.layoutFallback()
  }

  return {
    async getNavigation() {
      const layout = await loadLayout()
      return layout.header.headerLinks
        .filter((link) => link.isVisible)
        .map((link) => ({ label: link.label, href: link.href }))
    },

    async getAnnouncementBar() {
      const layout = await loadLayout()
      const a = layout.header.announcement
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
      return resolveSeoByPath(path)
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
