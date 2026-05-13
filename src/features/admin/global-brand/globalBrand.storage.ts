export const GLOBAL_BRAND_STORAGE_KEY = 'ANVL_GLOBAL_BRAND'

const hub = typeof window !== 'undefined' ? new EventTarget() : null

export const GLOBAL_BRAND_CHANGE_EVENT = 'anvl:global-brand:change'

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readGlobalBrandRaw(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(GLOBAL_BRAND_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeGlobalBrandRaw(json: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(GLOBAL_BRAND_STORAGE_KEY, json)
    hub?.dispatchEvent(new Event(GLOBAL_BRAND_CHANGE_EVENT))
  } catch {
    /* quota */
  }
}

export function subscribeGlobalBrandChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}

  hub?.addEventListener(GLOBAL_BRAND_CHANGE_EVENT, listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === GLOBAL_BRAND_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    hub?.removeEventListener(GLOBAL_BRAND_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
