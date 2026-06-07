import type { RuntimeClients } from '@/app/config/clients'
import { mockAccountClient } from '@/app/config/accountMock'
import { supabaseAccountClient } from '@/features/storefront-account/auth/supabaseAccountClient'
import { mockAnalyticsClient } from '@/features/analytics/api/analyticsClient.mock'
import { mockPaymentClient } from '@/features/checkout/api/paymentGateway.mock'
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
import { createCommerceClient } from '@/features/products/api/createCommerceClient'

export function createRuntimeClients(options: { isServer: boolean }): RuntimeClients {
  const supabase = getSupabasePublicEnv()
  const commerce = createCommerceClient(options)
  const accountClient = supabase ? supabaseAccountClient : mockAccountClient

  if (options.isServer) {
    const cms = supabase
      ? {
          ...seedCmsClient,
          ...createSupabaseCmsPublicReadSlice(supabase),
        }
      : seedCmsClient

    const siteSettings = supabase
      ? {
          ...seedSiteSettingsClient,
          ...createSupabaseSiteSettingsReadSlice(supabase),
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
      account: accountClient,
    }
  }

  const cms = supabase
    ? {
        ...localStorageCmsClient,
        ...createSupabaseCmsPublicReadSlice(supabase),
      }
    : localStorageCmsClient

  const siteSettings = supabase
    ? {
        ...localStorageSiteSettingsClient,
        ...createSupabaseSiteSettingsReadSlice(supabase),
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
