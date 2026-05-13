import { useSyncExternalStore } from 'react'
import { getLandingCmsContent } from './landingCms.service'
import { subscribeDropsChange } from '@/features/admin/drops/drops.storage'
import { subscribeWebsiteLayoutChange } from '@/features/admin/website-layout/websiteLayout.storage'
import type { LandingPageCmsContent } from './landingCms.types'

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
  ]
  return () => unsubs.forEach((u) => u())
}

function getServerSnapshot(initial?: LandingPageCmsContent) {
  return initial ?? serverSnapshot
}

/** Homepage CMS driven by drops + layout; updates when either changes in localStorage. */
export function useLandingCms(
  initial?: LandingPageCmsContent,
): LandingPageCmsContent {
  return useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => getServerSnapshot(initial),
  )
}
