import { useEffect, useMemo, useState } from 'react'

import { collectAssignedMediaUsage } from '@/features/cms/media/collectAssignedMediaIds'
import { subscribeBannerConfigChange } from '@/features/cms/banner/bannerConfig.settings'
import { subscribeComingSoonConfigChange } from '@/features/cms/comingSoon/comingSoon.settings'
import { subscribeCmsSiteConfigChange } from '@/features/cms/config/cmsSiteConfig.settings'
import { subscribeLandingContentChange } from '@/features/cms/landingContent/landingContent.settings'
import { subscribePassportContentChange } from '@/features/cms/passportContent/passportContent.settings'
import { subscribePdpContentChange } from '@/features/cms/pdpContent/pdpContent.settings'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'

export type AssignedMedia = {
  /** Media ids referenced by any media-id field in any CMS blob. */
  ids: Set<string>
  /** id → labels of every place that references it (badge tooltip). */
  usage: Map<string, string[]>
}

/**
 * Live "is this media asset assigned anywhere — and where?" for the library
 * badge, filter, and tooltip. `collectAssignedMediaUsage` reads every
 * media-id-carrying blob from its persisted store, so the result must
 * recompute when ANY of those stores change (a PDP/passport/coming-soon/banner
 * save, a cross-tab edit) — not only when the Assets editor's own working copy
 * (`assetConfigOverride`) does.
 */
export function useAssignedMedia(assetConfigOverride?: AssetConfig): AssignedMedia {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    const unsubscribes = [
      subscribeCmsSiteConfigChange(bump),
      subscribeLandingContentChange(bump),
      subscribePdpContentChange(bump),
      subscribePassportContentChange(bump),
      subscribeComingSoonConfigChange(bump),
      subscribeBannerConfigChange(bump),
    ]
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [])

  return useMemo(() => {
    const usage = collectAssignedMediaUsage(assetConfigOverride)
    return { ids: new Set(usage.keys()), usage }
    // `version` invalidates the persisted-store reads inside the collector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetConfigOverride, version])
}

/** Set-only convenience wrapper (kept for callers that only need the badge). */
export function useAssignedMediaIds(assetConfigOverride?: AssetConfig): Set<string> {
  return useAssignedMedia(assetConfigOverride).ids
}
