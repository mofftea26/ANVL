import type { AdminSession } from './adminAuth.types'

export const ADMIN_AUTH_STORAGE_KEYS = ['ANVL_ADMIN_AUTH', 'anvl.adminAuth.v1'] as const

/** Prefer new key first in reads; legacy key preserved for migration. */
export const ADMIN_AUTH_STORAGE_KEY = ADMIN_AUTH_STORAGE_KEYS[0]

/**
 * Build-time admin gate for the local CMS. Values are exposed in the client
 * bundle — treat as dev-only; replace with real auth before production.
 */
export const ADMIN_USERNAME =
  import.meta.env.VITE_ANVL_ADMIN_USERNAME?.trim() || 'admin'

const configuredPassword = import.meta.env.VITE_ANVL_ADMIN_PASSWORD ?? ''

export const ADMIN_PASSWORD = configuredPassword

/** False when no password is set — login should surface a configuration error. */
export const isAdminLoginConfigured = configuredPassword.length > 0

export const ADMIN_AUTH_CHANGE_EVENT = 'anvl:adminAuth:change'

const adminAuthEvents =
  typeof window !== 'undefined' ? new EventTarget() : null

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readAdminSession(): AdminSession | null {
  if (!isBrowser()) return null
  try {
    for (const key of ADMIN_AUTH_STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as Partial<AdminSession>
      if (
        !parsed ||
        typeof parsed.username !== 'string' ||
        typeof parsed.loggedInAt !== 'string'
      ) {
        window.localStorage.removeItem(key)
        continue
      }
      return { username: parsed.username, loggedInAt: parsed.loggedInAt }
    }
    return null
  } catch {
    ADMIN_AUTH_STORAGE_KEYS.forEach((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* */
      }
    })
    return null
  }
}

export function writeAdminSession(session: AdminSession): void {
  if (!isBrowser()) return
  try {
    const payload = JSON.stringify(session)
    ADMIN_AUTH_STORAGE_KEYS.forEach((key) => {
      window.localStorage.setItem(key, payload)
    })
    notifyAdminAuthChange()
  } catch {
    // Non-fatal in a demo CMS.
  }
}

export function clearAdminSession(): void {
  if (!isBrowser()) return
  try {
    ADMIN_AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key))
    notifyAdminAuthChange()
  } catch {
    // Swallow.
  }
}

function notifyAdminAuthChange() {
  adminAuthEvents?.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT))
}

export function subscribeAdminAuthChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}

  adminAuthEvents?.addEventListener(ADMIN_AUTH_CHANGE_EVENT, listener)
  const onStorage = (event: StorageEvent) => {
    if (isAdminAuthStorageKey(event.key)) listener()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    adminAuthEvents?.removeEventListener(ADMIN_AUTH_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

function isAdminAuthStorageKey(eventKey: string | null): boolean {
  if (!eventKey) return false
  return ADMIN_AUTH_STORAGE_KEYS.includes(
    eventKey as (typeof ADMIN_AUTH_STORAGE_KEYS)[number],
  )
}
