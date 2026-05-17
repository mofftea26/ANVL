/**
 * Generic localStorage channel — owns the cross-tab event plumbing that
 * every `*.storage.ts` previously hand-rolled (audit REU-05).
 *
 * Surface intentionally narrow:
 *   - `read(): string | null` / `write(value)` / `remove()`
 *   - `subscribe(listener)`: fires on same-tab writes (via EventTarget) AND
 *     cross-tab writes (via the browser `storage` event).
 *
 * SSR-safe: every method is a no-op on the server. The factory itself can
 * be called at module top-level because it does not touch `window` until
 * a method is invoked.
 */

export type LocalStorageChannel = {
  readonly key: string
  read(): string | null
  write(value: string): void
  remove(): void
  subscribe(listener: () => void): () => void
}

export type CreateLocalStorageChannelOptions = {
  /** localStorage key. */
  key: string
  /** Event name used for the same-tab EventTarget pubsub. */
  changeEvent: string
  /**
   * Optional sibling keys that should also trigger `subscribe()` callbacks
   * when their `storage` event fires (e.g. an "active id" pointer that
   * accompanies the main blob).
   */
  alsoListenForKeys?: ReadonlyArray<string>
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function createLocalStorageChannel(
  options: CreateLocalStorageChannelOptions,
): LocalStorageChannel {
  const { key, changeEvent, alsoListenForKeys } = options
  const events = isBrowser() ? new EventTarget() : null
  const watchedKeys = new Set<string>([key, ...(alsoListenForKeys ?? [])])

  const notify = () => {
    events?.dispatchEvent(new Event(changeEvent))
  }

  return {
    key,
    read(): string | null {
      if (!isBrowser()) return null
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    write(value: string): void {
      if (!isBrowser()) return
      try {
        window.localStorage.setItem(key, value)
        notify()
      } catch {
        // Quota / serialization errors are intentionally swallowed —
        // the admin will surface its own toast on save failures and the
        // storefront keeps reading stale-but-valid data.
      }
    },
    remove(): void {
      if (!isBrowser()) return
      try {
        window.localStorage.removeItem(key)
        notify()
      } catch {
        // swallow
      }
    },
    subscribe(listener: () => void): () => void {
      if (!isBrowser()) return () => {}
      events?.addEventListener(changeEvent, listener)
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && watchedKeys.has(event.key)) listener()
      }
      window.addEventListener('storage', onStorage)
      return () => {
        events?.removeEventListener(changeEvent, listener)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}
