import { useLayoutEffect, useMemo, useState } from 'react'
import type { Drop } from '@/features/drops/drop.types'
import { getActiveDrop } from '@/features/admin/drops/drops.service'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { useStorefrontPublication } from '@/features/cms/hooks/useStorefrontPublication'
import { ensureDropSystemHydrated } from '@/features/cms/read/dropRuntime'
import { subscribeDropsChange } from '@/features/cms/read/cmsSubscriptions'

/**
 * Local/demo CMS: prefer the persisted active drop once the client hydrates so the
 * storefront matches admin "Set active", while keeping the first paint aligned with
 * the SSR loader snapshot (avoids `initial ?? live` accidentally freezing the seed drop).
 */
export function pickLocalActiveDropForStorefront(
  live: Drop | null,
  initial: Drop | null | undefined,
): Drop | null {
  return live ?? initial ?? null
}

/** Supabase: publication snapshot wins; until then use SSR loader data only (not admin local drafts). */
export function pickSupabaseActiveDropForStorefront(
  published: Drop | null | undefined,
  initial: Drop | null | undefined,
): Drop | null {
  if (published) return published
  return initial ?? null
}

/**
 * Published active drop for storefront chrome and `/drop/:slug`.
 * Prefers Supabase `storefront_publication`; otherwise hydrates from admin persistence after mount.
 */
export function useActiveDrop(initial?: Drop | null): Drop | null {
  const publication = useStorefrontPublication()
  const supabaseEnv = Boolean(getSupabasePublicEnv())

  const [localLiveDrop, setLocalLiveDrop] = useState<Drop | null>(null)

  useLayoutEffect(() => {
    if (supabaseEnv) return

    ensureDropSystemHydrated()
    setLocalLiveDrop(getActiveDrop())

    return subscribeDropsChange(() => setLocalLiveDrop(getActiveDrop()))
  }, [supabaseEnv])

  return useMemo(() => {
    if (supabaseEnv) {
      const published = publication.data?.projection?.drop
      return pickSupabaseActiveDropForStorefront(published, initial)
    }
    return pickLocalActiveDropForStorefront(localLiveDrop, initial)
  }, [supabaseEnv, publication.data, initial, localLiveDrop])
}
