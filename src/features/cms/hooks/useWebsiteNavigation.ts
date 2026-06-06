import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { buildWebsiteNavigation } from '@/features/cms/navigation/websiteNavigation'
import type { WebsiteNavigationContent } from '@/features/cms/navigation/websiteNavigation'
import { resolveStorefrontWebsiteLayout } from '@/features/cms/runtime/storefrontCmsSync'
import { getGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.service'
import { subscribeWebsiteLayoutChange } from '@/features/cms/read/cmsSubscriptions'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchStorefrontPublicationView,
  STOREFRONT_PUBLICATION_QUERY_KEY,
} from '@/features/cms/hooks/storefrontPublicationQuery'

/**
 * Drop-free storefront navigation. Replaces the navigation slice that the
 * deprecated `useLandingCms` derived from the active drop. Sourced entirely from
 * the website layout (+ global brand emblem). See `docs/cms-teardown-plan.md`.
 */

// `useSyncExternalStore` requires stable snapshots — cache and recompute on change.
let clientSnapshot: WebsiteNavigationContent | null = null

function buildClientSnapshot(): WebsiteNavigationContent {
  const brand = getGlobalBrandSettings()
  return buildWebsiteNavigation(resolveStorefrontWebsiteLayout(), {
    emblemSrc: brand.emblemFallbackUrl,
    emblemAlt: 'ANVL',
  })
}

function getClientSnapshot(): WebsiteNavigationContent {
  if (clientSnapshot === null) clientSnapshot = buildClientSnapshot()
  return clientSnapshot
}

function subscribe(listener: () => void): () => void {
  return subscribeWebsiteLayoutChange(() => {
    clientSnapshot = buildClientSnapshot()
    listener()
  })
}

function useNavigationFromLocalStorage(
  initial: WebsiteNavigationContent,
): WebsiteNavigationContent {
  return useSyncExternalStore(subscribe, getClientSnapshot, () => initial)
}

function useNavigationFromSupabase(
  initial: WebsiteNavigationContent,
): WebsiteNavigationContent {
  const query = useQuery({
    queryKey: STOREFRONT_PUBLICATION_QUERY_KEY,
    queryFn: fetchStorefrontPublicationView,
    select: (view) =>
      view
        ? buildWebsiteNavigation(view.projection.layout, {
            emblemSrc: view.projection.globalBrand.emblemFallbackUrl,
            emblemAlt: 'ANVL',
          })
        : null,
    enabled: Boolean(getSupabasePublicEnv()),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  return query.data ?? initial
}

export function useWebsiteNavigation(
  initial: WebsiteNavigationContent,
): WebsiteNavigationContent {
  const fromLocal = useNavigationFromLocalStorage(initial)
  const fromSupabase = useNavigationFromSupabase(initial)
  return getSupabasePublicEnv() ? fromSupabase : fromLocal
}
