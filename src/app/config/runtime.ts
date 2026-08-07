import type { RuntimeClients } from '@/app/config/clients'
import { mockAccountClient } from '@/app/config/accountMock'
import { lazySupabaseAccountClient } from '@/features/storefront-account/auth/lazySupabaseAccountClient'
import { mockAnalyticsClient } from '@/features/analytics/api/analyticsClient.mock'
import { mockPaymentClient } from '@/features/checkout/api/paymentGateway.mock'
import { seedSeoClient } from '@/features/cms/api/seoClient.seed'
import { localStorageSeoClient } from '@/features/cms/api/seoClient.localStorage'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  createSupabaseSeoReadSlice,
} from '@/features/cms/api/supabaseStorefrontReaders'
import { createCommerceClient } from '@/features/products/api/createCommerceClient'
import { seedStoryClient } from '@/features/story/api/storyClient.seed'
import { createSupabaseStoryReadSlice } from '@/features/story/api/storyClient.supabase'

export function createRuntimeClients(options: { isServer: boolean }): RuntimeClients {
  const supabase = getSupabasePublicEnv()
  const commerce = createCommerceClient(options)
  const accountClient = supabase ? lazySupabaseAccountClient : mockAccountClient
  const story = supabase ? createSupabaseStoryReadSlice(supabase) : seedStoryClient

  if (options.isServer) {
    const seo = supabase
      ? {
          ...seedSeoClient,
          ...createSupabaseSeoReadSlice(supabase),
        }
      : seedSeoClient

    return {
      commerce,
      seo,
      story,
      analytics: mockAnalyticsClient,
      payment: mockPaymentClient,
      account: accountClient,
    }
  }

  const seo = supabase
    ? {
        ...localStorageSeoClient,
        ...createSupabaseSeoReadSlice(supabase),
      }
    : localStorageSeoClient

  return {
    commerce,
    seo,
    story,
    analytics: mockAnalyticsClient,
    payment: mockPaymentClient,
    account: accountClient,
  }
}

export const runtimeClients = createRuntimeClients({
  isServer: typeof window === 'undefined',
})
