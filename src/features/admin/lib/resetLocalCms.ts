import { ALL_ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'

const isBrowser = () => typeof window !== 'undefined'

/**
 * Clears every admin CMS localStorage key (admin "reset local data" action).
 *
 * Replaces the drop-builder `resetAllLocalCmsKeys` from the removed
 * `drops.service` — see `docs/cms-teardown-plan.md`.
 */
export function resetAllLocalCmsKeys(): void {
  if (!isBrowser()) return
  try {
    for (const key of ALL_ADMIN_STORAGE_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    /* ignore storage errors */
  }
}
