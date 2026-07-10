import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
} from '@/features/cms/hooks/storefrontPublicationQuery'
import {
  readComingSoonConfigFromStorage,
  subscribeComingSoonConfigChange,
} from '@/features/cms/comingSoon/comingSoon.settings'
import type { ComingSoonConfig } from '@/features/cms/comingSoon/comingSoon.zod'

function useConfigFromLocalStorage(initial: ComingSoonConfig): ComingSoonConfig {
  return useSyncExternalStore(
    subscribeComingSoonConfigChange,
    readComingSoonConfigFromStorage,
    () => initial,
  )
}

function useConfigFromSupabase(initial: ComingSoonConfig): ComingSoonConfig {
  const query = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    select: (view) => view?.projection.comingSoon ?? null,
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  return query.data ?? initial
}

/**
 * Live Coming Soon config for the public site-mode gate. Seeds from the root
 * loader's SSR projection (`initial`) so the very first paint is already
 * correct, then tracks the published row (Supabase) or the local admin
 * working copy (no-backend dev) so flipping the CMS toggle updates open tabs
 * without a reload.
 */
export function useComingSoonConfig(initial: ComingSoonConfig): ComingSoonConfig {
  const fromLocal = useConfigFromLocalStorage(initial)
  const fromSupabase = useConfigFromSupabase(initial)
  return getSupabasePublicEnv() ? fromSupabase : fromLocal
}
