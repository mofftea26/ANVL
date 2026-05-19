import { useQuery } from '@tanstack/react-query'
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
  offlineFallback: LandingPageCmsContent,
): LandingPageCmsContent {
  const query = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    select: (view) => view?.landing ?? null,
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  if (query.data != null) return query.data
  if (initial != null) return initial
  return offlineFallback
}

/**
 * Homepage CMS for the public storefront.
 * With Supabase: published snapshot when available; otherwise SSR initial, then the
 * same local/seed pipeline as before Supabase (offline, errors, empty publication).
 */
export function useLandingCms(
  initial?: LandingPageCmsContent,
): LandingPageCmsContent {
  const offlineFallback = useLandingCmsFromLocalStorage(initial)
  const fromSupabase = useLandingCmsFromSupabase(initial, offlineFallback)
  return getSupabasePublicEnv() ? fromSupabase : offlineFallback
}
