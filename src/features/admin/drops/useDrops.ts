import { useSyncExternalStore } from 'react'
import { subscribeDropsChange } from '@/features/admin/drops/drops.storage'
import {
  getActiveDrop,
  readDropsArray,
} from '@/features/admin/drops/drops.service'
import type { Drop } from '@/features/admin/drops/drops.types'

/**
 * Module snapshot cache — `useSyncExternalStore` requires `getSnapshot` to return a
 * stable reference unless the store changed. `readDropsArray()` parses fresh arrays
 * each call, which triggers infinite update loops without caching.
 */
let clientDropsSnapshot: Drop[] | null = null
let clientActiveDropSnapshot: Drop | null | undefined = undefined

const SERVER_DROPS_SNAPSHOT: Drop[] = []

function refreshSnapshots(): void {
  clientDropsSnapshot = readDropsArray()
  clientActiveDropSnapshot = getActiveDrop()
}

function ensureSnapshots(): void {
  if (clientDropsSnapshot === null || clientActiveDropSnapshot === undefined) {
    refreshSnapshots()
  }
}

function subscribeToDropsStore(listener: () => void): () => void {
  return subscribeDropsChange(() => {
    refreshSnapshots()
    listener()
  })
}

export function useDropsList(): Drop[] {
  return useSyncExternalStore(
    subscribeToDropsStore,
    () => {
      ensureSnapshots()
      return clientDropsSnapshot!
    },
    () => SERVER_DROPS_SNAPSHOT,
  )
}

export function useActiveDropClient(): Drop | null {
  return useSyncExternalStore(
    subscribeToDropsStore,
    () => {
      ensureSnapshots()
      return clientActiveDropSnapshot ?? null
    },
    () => null,
  )
}
