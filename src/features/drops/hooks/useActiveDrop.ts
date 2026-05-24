import { useMemo } from 'react'
import type { Drop } from '@/features/drops/drop.types'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { useStorefrontPublication } from '@/features/cms/hooks/useStorefrontPublication'
import { getStorefrontOfflineActiveDrop } from '@/features/cms/runtime/storefrontReadFallback'
import { useSyncExternalStore } from 'react'
import { subscribeDropsChange } from '@/features/cms/read/cmsSubscriptions'
import { ensureDropSystemHydrated } from '@/features/cms/read/dropRuntime'
import { getActiveDrop } from '@/features/admin/drops/drops.service'

function useOfflineActiveDrop(): Drop | null {
  return useSyncExternalStore(
    subscribeDropsChange,
    () => {
      if (typeof window === 'undefined') return getStorefrontOfflineActiveDrop()
      ensureDropSystemHydrated()
      return getActiveDrop()
    },
    () => getStorefrontOfflineActiveDrop(),
  )
}

/**
 * Published active drop for storefront chrome and `/drop/:slug`.
 * Prefers Supabase `storefront_publication`; falls back to local/seed offline pipeline.
 */
export function useActiveDrop(initial?: Drop | null): Drop | null {
  const offline = useOfflineActiveDrop()
  const publication = useStorefrontPublication()

  return useMemo(() => {
    if (!getSupabasePublicEnv()) {
      return initial ?? offline
    }
    const published = publication.data?.projection?.drop
    if (published) return published
    return initial ?? offline
  }, [publication.data, initial, offline])
}
