import type { AdminSession } from './adminAuth.types'
import { publicEnv } from '@/app/config/publicEnv'
import { createLocalStorageChannel } from '@/shared/lib/storage/createLocalStorageChannel'
import { isBrowser } from '@/shared/lib/storage/isBrowser'

export const ADMIN_AUTH_STORAGE_KEYS = ['ANVL_ADMIN_AUTH', 'anvl.adminAuth.v1'] as const

/** Prefer new key first in reads; legacy key preserved for migration. */
export const ADMIN_AUTH_STORAGE_KEY = ADMIN_AUTH_STORAGE_KEYS[0]

/**
 * Build-time admin gate for the local CMS. Values are exposed in the client
 * bundle — treat as dev-only; replace with real auth before production.
 */
export const ADMIN_USERNAME =
  publicEnv.VITE_ANVL_ADMIN_USERNAME?.trim() || 'admin'

const configuredPassword = publicEnv.VITE_ANVL_ADMIN_PASSWORD ?? ''

export const ADMIN_PASSWORD = configuredPassword

/** False when no password is set — login should surface a configuration error. */
export const isAdminLoginConfigured = configuredPassword.length > 0

/**
 * True when `candidate` equals the configured build-time admin password.
 * Mirrors the password check in {@link AdminAuthProvider} login (plain compare
 * against `VITE_ANVL_ADMIN_PASSWORD`); not a secure hash — dev gate only.
 */
export function verifyAdminPassword(candidate: string): boolean {
  if (!isAdminLoginConfigured) return false
  return candidate === configuredPassword
}

export const ADMIN_AUTH_CHANGE_EVENT = 'anvl:adminAuth:change'

const adminAuthChannel = createLocalStorageChannel({
  key: ADMIN_AUTH_STORAGE_KEY,
  changeEvent: ADMIN_AUTH_CHANGE_EVENT,
  alsoListenForKeys: [ADMIN_AUTH_STORAGE_KEYS[1]],
})

export { isBrowser }

export function readAdminSession(): AdminSession | null {
  if (!isBrowser()) return null
  try {
    for (const key of ADMIN_AUTH_STORAGE_KEYS) {
      const raw = adminAuthChannel.readKey(key)
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
    adminAuthChannel.notifyChange()
  } catch {
    // Non-fatal in a demo CMS.
  }
}

export function clearAdminSession(): void {
  if (!isBrowser()) return
  try {
    ADMIN_AUTH_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key))
    adminAuthChannel.notifyChange()
  } catch {
    // Swallow.
  }
}

export function subscribeAdminAuthChange(listener: () => void): () => void {
  return adminAuthChannel.subscribe(listener)
}
