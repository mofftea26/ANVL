import { useSyncExternalStore } from 'react'
import { getWebsiteLayoutContent } from './websiteLayout.service'
import { subscribeWebsiteLayoutChange } from './websiteLayout.storage'
import type { WebsiteLayoutContent } from './websiteLayout.types'

/**
 * Reactive snapshot of the persisted website layout. Mirrors `useDropsList`:
 * caches a stable snapshot per change event so `useSyncExternalStore` never
 * sees a fresh reference on every render.
 */
let clientSnapshot: WebsiteLayoutContent | null = null

const SERVER_SNAPSHOT_CACHE: { value: WebsiteLayoutContent | null } = {
  value: null,
}

function refresh(): void {
  clientSnapshot = getWebsiteLayoutContent()
}

function ensureSnapshot(): void {
  if (clientSnapshot === null) refresh()
}

function subscribe(listener: () => void): () => void {
  return subscribeWebsiteLayoutChange(() => {
    refresh()
    listener()
  })
}

function getServerSnapshot(): WebsiteLayoutContent {
  // SSR fallback — only the server side hits this. We compute lazily once.
  if (!SERVER_SNAPSHOT_CACHE.value) {
    SERVER_SNAPSHOT_CACHE.value = getWebsiteLayoutContent()
  }
  return SERVER_SNAPSHOT_CACHE.value
}

export function useWebsiteLayout(): WebsiteLayoutContent {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureSnapshot()
      return clientSnapshot!
    },
    getServerSnapshot,
  )
}
