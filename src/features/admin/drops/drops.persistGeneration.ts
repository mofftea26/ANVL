let dropsPersistGeneration = 0

/**
 * Incremented at the start of every `persistDropsState` so `useDropsList`'s
 * snapshot cache re-reads storage even when no `subscribeDropsChange` listener
 * ran (e.g. `createDraftDrop` on `/admin/drops/new` before the editor mounts).
 */
export function bumpDropsPersistGeneration(): void {
  dropsPersistGeneration += 1
}

export function getDropsPersistGeneration(): number {
  return dropsPersistGeneration
}
