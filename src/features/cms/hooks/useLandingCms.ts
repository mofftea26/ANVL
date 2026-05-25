import { fetchStorefrontPublicationView, STOREFRONT_PUBLICATION_QUERY_KEY } from '@/features/cms/hooks/storefrontPublicationQuery'
import { getLandingCmsContent } from '@/features/cms/landing/landingCmsRead'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { getResolvedStorefrontLandingCmsSync } from '@/features/cms/runtime/storefrontCmsSync'
import { subscribeDropsChange, subscribeWebsiteLayoutChange } from '@/features/cms/read/cmsSubscriptions'
import { subscribeSiteSeoChange } from '@/features/cms/siteSeo.local'
import { useQuery } from '@tanstack/react-query'
import { useLayoutEffect, useMemo, useState } from 'react'

function useLandingCmsFromLocalStorage(
  initial?: LandingPageCmsContent,
): LandingPageCmsContent {
  const [live, setLive] = useState<LandingPageCmsContent | null>(null)

  const fallback = useMemo(
    () =>
      initial ??
      getResolvedStorefrontLandingCmsSync({ forceSsrSnapshot: true }),
    [initial],
  )

  useLayoutEffect(() => {
    setLive(getLandingCmsContent())
    const wrapped = () => setLive(getLandingCmsContent())
    const unsubs = [
      subscribeDropsChange(wrapped),
      subscribeWebsiteLayoutChange(wrapped),
      subscribeSiteSeoChange(wrapped),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  return live ?? fallback
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
 *
 * Local CMS: first paint matches SSR loader output, then replaces with composed active
 * drop + layout from persistence so theme/acts track the editor without hydration drift.
 */
export function useLandingCms(
  initial?: LandingPageCmsContent,
): LandingPageCmsContent {
  const fromLocal = useLandingCmsFromLocalStorage(initial)
  const fromSupabase = useLandingCmsFromSupabase(initial)
  return getSupabasePublicEnv() ? fromSupabase : fromLocal
}
