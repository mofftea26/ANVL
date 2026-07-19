import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
} from '@/features/cms/hooks/storefrontPublicationQuery'
import {
  readBannerConfigFromStorage,
  subscribeBannerConfigChange,
} from '@/features/cms/banner/bannerConfig.settings'
import type { BannerConfig } from '@/features/cms/banner/bannerConfig.zod'
import { usePreviewDraft } from '@/features/cms/preview'

function useConfigFromLocalStorage(initial: BannerConfig): BannerConfig {
  return useSyncExternalStore(
    subscribeBannerConfigChange,
    readBannerConfigFromStorage,
    () => initial,
  )
}

function useConfigFromSupabase(initial: BannerConfig): BannerConfig {
  const query = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    select: (view) => view?.projection.bannerConfig ?? null,
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  return query.data ?? initial
}

/**
 * Live announcement-banner config for the storefront rail. Seeds from the
 * root loader's SSR projection (`initial`) so the very first paint is already
 * correct, then tracks the published row (Supabase) or the local admin
 * working copy (no-backend dev). Inside the admin live-preview iframe,
 * unsaved banner edits win outright.
 */
export function useBannerConfig(initial: BannerConfig): BannerConfig {
  const fromLocal = useConfigFromLocalStorage(initial)
  const fromSupabase = useConfigFromSupabase(initial)
  const previewDraft = usePreviewDraft()
  return previewDraft?.banner ?? (getSupabasePublicEnv() ? fromSupabase : fromLocal)
}
