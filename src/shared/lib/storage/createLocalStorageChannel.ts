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
  /**
   * Read any watched key (primary `key` or `alsoListenForKeys` entry).
   * Unknown keys return `null` without touching storage.
   */
  readKey(storageKey: string): string | null
  /**
   * Write or remove a watched key and notify subscribers (same-tab + cross-tab).
   * Passing `null` removes the key. Unknown keys are ignored.
   */
  writeKey(storageKey: string, value: string | null): void
  /**
   * Notify subscribers without a storage mutation — for mirrored multi-key
   * writes (e.g. admin auth session duplicated across legacy keys).
   */
  notifyChange(): void
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

import { isBrowser } from './isBrowser'

export function createLocalStorageChannel(
  options: CreateLocalStorageChannelOptions,
): LocalStorageChannel {
  const { key, changeEvent, alsoListenForKeys } = options
  const events = isBrowser() ? new EventTarget() : null
  const watchedKeys = new Set<string>([key, ...(alsoListenForKeys ?? [])])

  const notify = () => {
    events?.dispatchEvent(new Event(changeEvent))
  }

  const readKeyImpl = (storageKey: string): string | null => {
    if (!watchedKeys.has(storageKey)) return null
    if (!isBrowser()) return null
    try {
      return window.localStorage.getItem(storageKey)
    } catch {
      return null
    }
  }

  const writeKeyImpl = (storageKey: string, value: string | null): void => {
    if (!watchedKeys.has(storageKey)) return
    if (!isBrowser()) return
    try {
      if (value === null) window.localStorage.removeItem(storageKey)
      else window.localStorage.setItem(storageKey, value)
      notify()
    } catch {
      // Quota errors — same policy as `write()`.
    }
  }

  return {
    key,
    read(): string | null {
      return readKeyImpl(key)
    },
    write(value: string): void {
      writeKeyImpl(key, value)
    },
    remove(): void {
      writeKeyImpl(key, null)
    },
    readKey(storageKey: string): string | null {
      return readKeyImpl(storageKey)
    },
    writeKey(storageKey: string, value: string | null): void {
      writeKeyImpl(storageKey, value)
    },
    notifyChange(): void {
      notify()
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
