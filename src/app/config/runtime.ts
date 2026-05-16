import type { RuntimeClients } from '@/app/config/clients'
import { mockAccountClient } from '@/app/config/accountMock'
import { mockAnalyticsClient } from '@/features/analytics/api/analyticsClient.mock'
import { mockPaymentClient } from '@/features/checkout/api/paymentGateway.mock'
import { seedCmsClient } from '@/features/cms/api/cmsClient.seed'
import { localStorageCmsClient } from '@/features/cms/api/cmsClient.localStorage'
import { seedSeoClient } from '@/features/cms/api/seoClient.seed'
import { localStorageSeoClient } from '@/features/cms/api/seoClient.localStorage'
import { seedSiteSettingsClient } from '@/features/cms/api/siteSettingsClient.seed'
import { localStorageSiteSettingsClient } from '@/features/cms/api/siteSettingsClient.localStorage'
import { seedCommerceClient } from '@/features/products/api/commerceClient.seed'
import { localStorageCommerceClient } from '@/features/products/api/commerceClient.localStorage'

/**
 * Factory for storefront runtime clients. Server uses seed adapters (no `localStorage`);
 * the browser uses persisted admin state so the CMS and public routes stay aligned.
 *
 * TODO: add Medusa-backed factories and branch on env when the commerce backend ships.
 */
export function createRuntimeClients(options: { isServer: boolean }): RuntimeClients {
  if (options.isServer) {
    return {
      cms: seedCmsClient,
      commerce: seedCommerceClient,
      seo: seedSeoClient,
      siteSettings: seedSiteSettingsClient,
      analytics: mockAnalyticsClient,
      payment: mockPaymentClient,
      account: mockAccountClient,
    }
  }
  return {
    cms: localStorageCmsClient,
    commerce: localStorageCommerceClient,
    seo: localStorageSeoClient,
    siteSettings: localStorageSiteSettingsClient,
    analytics: mockAnalyticsClient,
    payment: mockPaymentClient,
    account: mockAccountClient,
  }
}

export const runtimeClients = createRuntimeClients({
  isServer: typeof window === 'undefined',
})
