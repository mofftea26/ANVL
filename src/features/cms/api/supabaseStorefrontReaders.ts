import type { CmsClient, SeoClient, SiteSettingsClient } from '@/app/config/clients'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'
import { DEFAULT_SITE_HOMEPAGE } from '@/features/cms/siteHomepage.settings'
import {
  buildStaticWebsiteNavigation,
  staticHeaderNavLinks,
} from '@/features/cms/navigation/staticWebsiteNavigation'
import { createDefaultWebsiteLayout } from '@/features/cms/layout/websiteLayout.defaults'

const STATIC_NAV = buildStaticWebsiteNavigation()

export type SupabaseCmsPublicReadSlice = Pick<
  CmsClient,
  'getNavigation' | 'getAnnouncementBar' | 'getCampaigns' | 'getLookbook' | 'getSiteHomepage'
>

export function createSupabaseCmsPublicReadSlice(
  _env: SupabasePublicEnv,
): SupabaseCmsPublicReadSlice {
  return {
    async getNavigation() {
      return staticHeaderNavLinks().map((link) => ({
        label: link.label,
        href: link.href,
      }))
    },

    async getAnnouncementBar() {
      const a = STATIC_NAV.announcement
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
      return cmsMockData.campaigns
    },
    async getLookbook() {
      return cmsMockData.lookbook
    },

    async getSiteHomepage() {
      return DEFAULT_SITE_HOMEPAGE
    },
  }
}

export function createSupabaseSiteSettingsReadSlice(
  _env: SupabasePublicEnv,
): Pick<SiteSettingsClient, 'getWebsiteLayout'> {
  return {
    async getWebsiteLayout() {
      return structuredClone(createDefaultWebsiteLayout())
    },
  }
}

export function createSupabaseSeoReadSlice(
  _env: SupabasePublicEnv,
): Pick<SeoClient, 'getSeoByPath' | 'getSiteSeo'> {
  return {
    async getSeoByPath(path: string) {
      return resolveSeoByPath(path)
    },

    async getSiteSeo() {
      return defaultSiteSeoContent()
    },
  }
}
