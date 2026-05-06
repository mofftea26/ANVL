import { mockCommerceClient } from '@/features/products/api/commerceClient.mock'
import { mockCmsClient } from '@/features/cms/api/cmsClient.mock'
import { mockAnalyticsClient } from '@/features/analytics/api/analyticsClient.mock'
import { mockPaymentClient } from '@/features/checkout/api/paymentGateway.mock'

export const runtimeClients = {
  commerce: mockCommerceClient,
  cms: mockCmsClient,
  analytics: mockAnalyticsClient,
  payment: mockPaymentClient,
}
