import { useQuery } from '@tanstack/react-query'
import type { Drop } from '@/features/drops/drop.types'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
} from '@/features/cms/hooks/storefrontPublicationQuery'

/**
 * Active drop for public storefront chrome (theme palette, loading emblem context).
 * With Supabase: published snapshot from `storefront_publication` (refetches on focus).
 * Without Supabase: SSR `initialDrop` only (local admin storage is not used on the public site).
 */
export function useStorefrontActiveDrop(initialDrop: Drop | null): Drop | null {
  const env = getSupabasePublicEnv()
  const query = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    select: (view) => view?.projection.drop ?? null,
    enabled: Boolean(env),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  if (!env) return initialDrop
  if (query.data != null) return query.data
  return initialDrop
}
