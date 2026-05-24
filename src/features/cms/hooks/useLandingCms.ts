import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { subscribeSiteSeoChange } from '@/features/cms/siteSeo.local'
import { useSyncExternalStore } from 'react'
import { subscribeDropsChange, subscribeWebsiteLayoutChange } from '@/features/cms/read/cmsSubscriptions'
import { getLandingCmsContent } from '@/features/cms/landing/landingCmsRead'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
} from '@/features/cms/hooks/storefrontPublicationQuery'
import { getResolvedStorefrontLandingCmsSync } from '@/features/cms/runtime/storefrontCmsSync'

/**
 * Module-scoped snapshot cache — `useSyncExternalStore` requires stable snapshots.
 */
let clientSnapshot: LandingPageCmsContent | null = null
const serverSnapshot = getLandingCmsContent()

function getClientSnapshot(): LandingPageCmsContent {
  if (clientSnapshot === null) {
    clientSnapshot = getLandingCmsContent()
  }
  return clientSnapshot
}

function refreshClientSnapshot() {
  clientSnapshot = getLandingCmsContent()
}

function subscribe(listener: () => void): () => void {
  const wrapped = () => {
    refreshClientSnapshot()
    listener()
  }
  const unsubs = [
    subscribeDropsChange(wrapped),
    subscribeWebsiteLayoutChange(wrapped),
    subscribeSiteSeoChange(wrapped),
  ]
  return () => unsubs.forEach((u) => u())
}

function getServerSnapshot(initial?: LandingPageCmsContent) {
  return initial ?? serverSnapshot
}

function useLandingCmsFromLocalStorage(
  initial?: LandingPageCmsContent,
): LandingPageCmsContent {
  return useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => getServerSnapshot(initial),
  )
}

function useLandingCmsFromSupabase(
  initial: LandingPageCmsContent | undefined,
): LandingPageCmsContent {
  const publishedFallback = useMemo(
    () =>
      initial ??
      getResolvedStorefrontLandingCmsSync({ forceSsrSnapshot: true }),
    [initial],
  )

  const query = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    select: (view) => view?.landing ?? null,
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  if (query.data != null) return query.data
  return publishedFallback
}

/**
 * Homepage CMS for the public storefront.
 * With Supabase: published snapshot when available; SSR initial or seed fallback
 * (never admin localStorage drafts on the public site).
 */
export function useLandingCms(
  initial?: LandingPageCmsContent,
): LandingPageCmsContent {
  const fromLocal = useLandingCmsFromLocalStorage(initial)
  const fromSupabase = useLandingCmsFromSupabase(initial)
  return getSupabasePublicEnv() ? fromSupabase : fromLocal
}
