import type { CommerceClient } from '@/app/config/clients'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { shopifyCommerceClient } from '@/features/products/api/commerceClient.shopify'
import { supabaseCommerceClient } from '@/features/products/api/commerceClient.supabase'
import { localStorageCommerceClient } from '@/features/products/api/commerceClient.localStorage'
import { seedCommerceClient } from '@/features/products/api/commerceClient.seed'

/**
 * Commerce adapter selection:
 * 1. Shopify Storefront API when `VITE_SHOPIFY_*` is set (with offline fallbacks inside).
 * 2. Supabase `products_snapshot` when only Supabase is set.
 * 3. localStorage (browser) or seed (SSR) otherwise.
 */
export function createCommerceClient(options: { isServer: boolean }): CommerceClient {
  if (getShopifyPublicEnv()) {
    return shopifyCommerceClient
  }
  if (getSupabasePublicEnv()) {
    return supabaseCommerceClient
  }
  return options.isServer ? seedCommerceClient : localStorageCommerceClient
}
