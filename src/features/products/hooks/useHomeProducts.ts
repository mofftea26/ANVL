import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { subscribeProductsChange } from '@/features/products/catalog/productSubscriptions'
import { getStorefrontProductsForHome } from '@/features/products/catalog/storefrontCatalog'
import { runtimeClients } from '@/app/config/runtime'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { STOREFRONT_PUBLICATION_QUERY_KEY } from '@/features/cms/hooks/storefrontPublicationQuery'

let snapshot: Product[] | null = null

function readSnapshot(): Product[] {
  if (snapshot === null) snapshot = getStorefrontProductsForHome()
  return snapshot
}

function subscribe(listener: () => void): () => void {
  return subscribeProductsChange(() => {
    snapshot = null
    listener()
  })
}

function useHomeProductsFromLocalStorage(initial: Product[]): Product[] {
  return useSyncExternalStore(
    subscribe,
    () => readSnapshot(),
    () => initial,
  )
}

function useHomeProductsFromSupabase(
  initial: Product[],
  offlineFallback: Product[],
): Product[] {
  const query = useQuery({
    queryKey: [...STOREFRONT_PUBLICATION_QUERY_KEY, 'home-products'],
    queryFn: () => runtimeClients.commerce.getHomeProducts(),
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    placeholderData: initial,
    refetchOnWindowFocus: true,
  })

  if (query.data != null && query.data.length > 0) return query.data
  if (initial.length > 0) return initial
  return offlineFallback
}

/**
 * Homepage product strip — published catalog when Supabase succeeds; otherwise the
 * same local catalog assignments as the pre-Supabase storefront.
 */
export function useHomeProducts(initial: Product[]): Product[] {
  const offlineFallback = useHomeProductsFromLocalStorage(initial)
  const fromSupabase = useHomeProductsFromSupabase(initial, offlineFallback)
  return getSupabasePublicEnv() ? fromSupabase : offlineFallback
}
