import { useQuery } from '@tanstack/react-query'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
  type StorefrontPublicationView,
} from '@/features/cms/hooks/storefrontPublicationQuery'

export function useStorefrontPublication(
  initial?: StorefrontPublicationView | null,
) {
  return useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: initial ?? undefined,
  })
}
