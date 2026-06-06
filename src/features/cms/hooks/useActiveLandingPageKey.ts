import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
} from '@/features/cms/hooks/storefrontPublicationQuery'
import {
  readActiveLandingPageFromStorage,
  subscribeActiveLandingPageChange,
} from '@/features/cms/landingPageActiveKey.settings'
import { DEFAULT_LANDING_PAGE_KEY } from '@/features/landingPages/registry'

function getLocalSnapshot(): string {
  return readActiveLandingPageFromStorage().key
}

function useActiveKeyFromLocalStorage(initial?: string): string {
  return useSyncExternalStore(
    subscribeActiveLandingPageChange,
    getLocalSnapshot,
    () => initial ?? DEFAULT_LANDING_PAGE_KEY,
  )
}

function useActiveKeyFromSupabase(initial?: string): string {
  const query = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    select: (view) => view?.projection.activeLandingPageKey ?? null,
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  if (query.data != null) return query.data
  return initial ?? DEFAULT_LANDING_PAGE_KEY
}

/**
 * Active code-owned landing page key for the public home route.
 * With Supabase: the published key (live admin edits via local mirror otherwise).
 * The raw key is validated against the registry at render (`resolveLandingPage`).
 */
export function useActiveLandingPageKey(initial?: string): string {
  const fromLocal = useActiveKeyFromLocalStorage(initial)
  const fromSupabase = useActiveKeyFromSupabase(initial)
  return getSupabasePublicEnv() ? fromSupabase : fromLocal
}
