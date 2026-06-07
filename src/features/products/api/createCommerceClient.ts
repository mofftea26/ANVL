import type { CommerceClient } from '@/app/config/clients'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import { shopifyCommerceClient } from '@/features/products/api/commerceClient.shopify'
import { localStorageCommerceClient } from '@/features/products/api/commerceClient.localStorage'
import { seedCommerceClient } from '@/features/products/api/commerceClient.seed'

/**
 * Commerce adapter selection:
 * 1. Shopify Storefront API when `VITE_SHOPIFY_*` is set.
 * 2. Seed (SSR) or localStorage catalog otherwise — products CMS was removed.
 */
export function createCommerceClient(options: { isServer: boolean }): CommerceClient {
  if (getShopifyPublicEnv()) {
    return shopifyCommerceClient
  }
  return options.isServer ? seedCommerceClient : localStorageCommerceClient
}
