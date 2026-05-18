/** Prevents debounced Supabase sync from racing initial pull-to-localStorage hydration. */
let hydrationDepth = 0

export function beginAdminCmsRemoteHydration(): void {
  hydrationDepth += 1
}

export function endAdminCmsRemoteHydration(): void {
  hydrationDepth = Math.max(0, hydrationDepth - 1)
}

export function isAdminCmsRemoteHydrationLocked(): boolean {
  return hydrationDepth > 0
}
