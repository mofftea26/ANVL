export const WEBSITE_LAYOUT_STORAGE_KEY = 'ANVL_WEBSITE_LAYOUT'

const events = typeof window !== 'undefined' ? new EventTarget() : null

export const WEBSITE_LAYOUT_CHANGE_EVENT = 'anvl:websiteLayout:change'

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readWebsiteLayoutRaw(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(WEBSITE_LAYOUT_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeWebsiteLayoutRaw(json: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(WEBSITE_LAYOUT_STORAGE_KEY, json)
    events?.dispatchEvent(new Event(WEBSITE_LAYOUT_CHANGE_EVENT))
  } catch {
    /* */
  }
}

export function subscribeWebsiteLayoutChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}

  events?.addEventListener(WEBSITE_LAYOUT_CHANGE_EVENT, listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === WEBSITE_LAYOUT_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    events?.removeEventListener(WEBSITE_LAYOUT_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
