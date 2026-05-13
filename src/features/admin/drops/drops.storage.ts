export const DROPS_STORAGE_KEY = 'ANVL_DROPS'
export const ACTIVE_DROP_ID_STORAGE_KEY = 'ANVL_ACTIVE_DROP_ID'

const dropsEvents =
  typeof window !== 'undefined' ? new EventTarget() : null

export const DROPS_CHANGE_EVENT = 'anvl:drops:change'

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readDropsRaw(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(DROPS_STORAGE_KEY)
  } catch {
    return null
  }
}

export function readActiveDropIdRaw(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(ACTIVE_DROP_ID_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeDropsRaw(json: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(DROPS_STORAGE_KEY, json)
    notifyDropsChange()
  } catch {
    /* quota */
  }
}

export function writeActiveDropId(id: string | null): void {
  if (!isBrowser()) return
  try {
    if (id === null) window.localStorage.removeItem(ACTIVE_DROP_ID_STORAGE_KEY)
    else window.localStorage.setItem(ACTIVE_DROP_ID_STORAGE_KEY, id)
    notifyDropsChange()
  } catch {
    /* */
  }
}

function notifyDropsChange() {
  dropsEvents?.dispatchEvent(new Event(DROPS_CHANGE_EVENT))
}

export function subscribeDropsChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}

  dropsEvents?.addEventListener(DROPS_CHANGE_EVENT, listener)
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === DROPS_STORAGE_KEY ||
      event.key === ACTIVE_DROP_ID_STORAGE_KEY
    )
      listener()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    dropsEvents?.removeEventListener(DROPS_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}
