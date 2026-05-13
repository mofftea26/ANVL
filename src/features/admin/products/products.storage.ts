export const PRODUCTS_STORAGE_KEY = 'ANVL_PRODUCTS'

const events = typeof window !== 'undefined' ? new EventTarget() : null

export const PRODUCTS_CHANGE_EVENT = 'anvl:products:change'

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readProductsRaw(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(PRODUCTS_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeProductsRaw(json: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, json)
    events?.dispatchEvent(new Event(PRODUCTS_CHANGE_EVENT))
  } catch {
    /* */
  }
}

export function subscribeProductsChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}

  events?.addEventListener(PRODUCTS_CHANGE_EVENT, listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === PRODUCTS_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    events?.removeEventListener(PRODUCTS_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
