import type { RuntimeClients } from '@/app/config/clients'
import { mockAccountClient } from '@/app/config/accountMock'
import { mockAnalyticsClient } from '@/features/analytics/api/analyticsClient.mock'
import { mockPaymentClient } from '@/features/checkout/api/paymentGateway.mock'
import { SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'
import { seedCmsClient } from '@/features/cms/api/cmsClient.seed'
import { localStorageCmsClient } from '@/features/cms/api/cmsClient.localStorage'
import { seedSeoClient } from '@/features/cms/api/seoClient.seed'
import { localStorageSeoClient } from '@/features/cms/api/seoClient.localStorage'
import { seedSiteSettingsClient } from '@/features/cms/api/siteSettingsClient.seed'
import { localStorageSiteSettingsClient } from '@/features/cms/api/siteSettingsClient.localStorage'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  createSupabaseCmsPublicReadSlice,
  createSupabaseSeoReadSlice,
  createSupabaseSiteSettingsReadSlice,
} from '@/features/cms/api/supabaseStorefrontReaders'
import {
  getStorefrontOfflineActiveDrop,
  getStorefrontOfflineLandingCms,
} from '@/features/cms/runtime/storefrontReadFallback'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { createCommerceClient } from '@/features/products/api/createCommerceClient'

/**
 * Factory for storefront runtime clients. Server uses seed adapters (no `localStorage`)
 * unless `VITE_SUPABASE_URL` + anon key are set — then **published** CMS projection is read
 * from Supabase so SSR matches all visitors (including commerce catalog snapshots).
 *
 * Browser: admin mutations use localStorage as working copy with Supabase write-through
 * when configured; **public** CMS/commerce reads prefer Supabase publication (never admin drafts).
 *
 * Commerce: Shopify Storefront API when configured, else Supabase snapshot, else local/seed.
 */
export function createRuntimeClients(options: { isServer: boolean }): RuntimeClients {
  const supabase = getSupabasePublicEnv()
  const commerce = createCommerceClient(options)

  if (options.isServer) {
    const cms = supabase
      ? {
          ...seedCmsClient,
          ...createSupabaseCmsPublicReadSlice(supabase, {
            landingFallback: () => getStorefrontOfflineLandingCms(),
            activeDropFallback: () => getStorefrontOfflineActiveDrop(),
          }),
        }
      : seedCmsClient

    const siteSettings = supabase
      ? {
          ...seedSiteSettingsClient,
          ...createSupabaseSiteSettingsReadSlice(
            supabase,
            () => structuredClone(SEED_WEBSITE_LAYOUT),
          ),
        }
      : seedSiteSettingsClient

    const seo = supabase
      ? {
          ...seedSeoClient,
          ...createSupabaseSeoReadSlice(supabase),
        }
      : seedSeoClient

    return {
      cms,
      commerce,
      seo,
      siteSettings,
      analytics: mockAnalyticsClient,
      payment: mockPaymentClient,
      account: mockAccountClient,
    }
  }

  const cms = supabase
    ? {
        ...localStorageCmsClient,
        ...createSupabaseCmsPublicReadSlice(supabase, {
          landingFallback: () => getStorefrontOfflineLandingCms(),
          activeDropFallback: () => getStorefrontOfflineActiveDrop(),
        }),
      }
    : localStorageCmsClient

  const siteSettings = supabase
    ? {
        ...localStorageSiteSettingsClient,
        ...createSupabaseSiteSettingsReadSlice(supabase, () =>
          getWebsiteLayoutContent(),
        ),
      }
    : localStorageSiteSettingsClient

  const seo = supabase
    ? {
        ...localStorageSeoClient,
        ...createSupabaseSeoReadSlice(supabase),
      }
    : localStorageSeoClient

  return {
    cms,
    commerce,
    seo,
    siteSettings,
    analytics: mockAnalyticsClient,
    payment: mockPaymentClient,
    account: mockAccountClient,
  }
}

export const runtimeClients = createRuntimeClients({
  isServer: typeof window === 'undefined',
})
