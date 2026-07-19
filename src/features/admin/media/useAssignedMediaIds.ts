import { useEffect, useMemo, useState } from 'react'

import { collectAssignedMediaIds } from '@/features/cms/media/collectAssignedMediaIds'
import { subscribeComingSoonConfigChange } from '@/features/cms/comingSoon/comingSoon.settings'
import { subscribeCmsSiteConfigChange } from '@/features/cms/config/cmsSiteConfig.settings'
import { subscribeLandingContentChange } from '@/features/cms/landingContent/landingContent.settings'
import { subscribePassportContentChange } from '@/features/cms/passportContent/passportContent.settings'
import { subscribePdpContentChange } from '@/features/cms/pdpContent/pdpContent.settings'
import { subscribeShopConfigChange } from '@/features/cms/shop/shopExperience.settings'
import type { AssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'

/**
 * Live "is this media asset assigned anywhere?" set for the library badge and
 * filter. `collectAssignedMediaIds` reads every media-assigning blob from its
 * persisted store, so the set must recompute when ANY of those stores change
 * (a PDP/passport/coming-soon save, a cross-tab edit) — not only when the
 * Assets editor's own working copy (`assetConfigOverride`) does. Previously
 * the memo depended on the working copy alone, so assignments made in other
 * editors never refreshed the badge until a remount.
 */
export function useAssignedMediaIds(assetConfigOverride?: AssetConfig): Set<string> {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    const unsubscribes = [
      subscribeCmsSiteConfigChange(bump),
      subscribeLandingContentChange(bump),
      subscribePdpContentChange(bump),
      subscribePassportContentChange(bump),
      subscribeShopConfigChange(bump),
      subscribeComingSoonConfigChange(bump),
    ]
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [])

  return useMemo(
    () => collectAssignedMediaIds(assetConfigOverride),
    [assetConfigOverride, version],
  )
}
