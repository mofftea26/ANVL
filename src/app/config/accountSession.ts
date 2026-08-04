const STORAGE_KEY = 'anvl.storefrontAccount.customerId'

let sessionCustomerId: string | null = null
let clientStorageSynced = false

function readBrowserSession(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeBrowserSession(id: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (id) window.sessionStorage.setItem(STORAGE_KEY, id)
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Demo-only session pointer for the MOCK account client.
 *
 * TODO(backend, medium): replace with an HttpOnly server session once a
 * commerce backend lands. Scope note: this is NOT the admin session — `/admin`
 * already uses a sealed HttpOnly cookie (`adminAuthSession.server.ts`, SEC-11),
 * and storefront customers already authenticate against Supabase. This pointer
 * only backs the in-memory mock, so it is not a live security gap.
 */
export function setSessionCustomerId(id: string | null): void {
  sessionCustomerId = id
  writeBrowserSession(id)
  if (typeof window !== 'undefined') clientStorageSynced = true
}

export function getSessionCustomerId(): string | null {
  if (typeof window !== 'undefined' && !clientStorageSynced) {
    sessionCustomerId = readBrowserSession()
    clientStorageSynced = true
  }
  return sessionCustomerId
}
