import type { SupabaseClient } from '@supabase/supabase-js'
import { createAnvlSupabaseClient } from '@/features/cms/api/createAnvlSupabaseClient'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
export const ADMIN_SUPABASE_AUTH_STORAGE_KEY = 'anvl.supabase.admin.v1'

type AdminSupabaseGlobal = typeof globalThis & {
  __anvlAdminSupabaseClient?: SupabaseClient | null
  /** Recreate client when URL/key changes (HMR or .env fix without full reload). */
  __anvlAdminSupabaseClientEnvKey?: string
  /** Bumped when the in-memory client is disposed so bootstrap work can abort. */
  __anvlAdminAuthBootstrapEpoch?: number
}

function adminClientStore(): AdminSupabaseGlobal {
  return globalThis as AdminSupabaseGlobal
}

/** Monotonic epoch; login/dispose bumps it so stale bootstrap `getSession` is ignored. */
export function getAdminAuthBootstrapEpoch(): number {
  return adminClientStore().__anvlAdminAuthBootstrapEpoch ?? 0
}

export function invalidateAdminAuthBootstrap(): void {
  const store = adminClientStore()
  store.__anvlAdminAuthBootstrapEpoch =
    (store.__anvlAdminAuthBootstrapEpoch ?? 0) + 1
}

/** True when admin GoTrue session JSON is present in localStorage. */
export function hasAdminSupabaseAuthStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(ADMIN_SUPABASE_AUTH_STORAGE_KEY)
    return raw != null && raw.length > 0
  } catch {
    return false
  }
}

/** Removes persisted admin GoTrue session (fixes hangs after key/env changes). */
export function clearAdminSupabaseAuthStorage(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ADMIN_SUPABASE_AUTH_STORAGE_KEY)
  } catch {
    /* non-fatal */
  }
}

/**
 * Browser-only Supabase client with its own auth storage key so anon SSR reads
 * never collide with the admin session. Singleton lives on `globalThis` so Vite
 * HMR does not spawn a second GoTrue client for the same storage key.
 */
export function getAdminSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  const env = getSupabasePublicEnv()
  if (!env) return null

  const store = adminClientStore()
  const envKey = `${env.url}\0${env.anonKey}`
  if (
    store.__anvlAdminSupabaseClient &&
    store.__anvlAdminSupabaseClientEnvKey === envKey
  ) {
    return store.__anvlAdminSupabaseClient
  }

  store.__anvlAdminSupabaseClient = createAnvlSupabaseClient(env, {
    auth: {
      // SECURITY (F-20): the session is held in MEMORY ONLY. It used to be
      // persisted under ADMIN_SUPABASE_AUTH_STORAGE_KEY, which put the admin's
      // Supabase REFRESH token in same-origin localStorage — readable by any
      // script on the page, and directly contradicting the sealed-HttpOnly-
      // cookie design this file's own comment describes. Paired with the CMS
      // SVG sink (see `themeSvgMarkupForTint`) that was a complete
      // editor -> admin takeover chain, and a Report-Only CSP carrying
      // `script-src 'unsafe-inline'` would not have stopped it.
      //
      // Nothing is lost by not persisting: the sealed cookie is already the
      // sole source of truth, and `AdminAuthProvider` re-applies fresh tokens
      // from the server on login, on mount and on every heartbeat. What the
      // persisted copy actually did was mask a race — see the awaited
      // `setSession` in `applyAuthenticatedResult`.
      //
      // NOTE: this stops the token being PERSISTED, not it reaching the
      // browser at all. Removing it entirely means moving to supabase-js's
      // `accessToken` factory, which disables `supabase.auth.*` — and
      // `auth.getSession()` is currently called by 8 admin services. That
      // migration is tracked separately.
      persistSession: false,
      // The HttpOnly session cookie (adminAuthSession.server.ts) is the sole
      // authority for refresh-token rotation — AdminAuthProvider re-applies
      // fresh tokens from the server on login/mount/heartbeat via setSession().
      // Letting GoTrue also auto-refresh here would race the server for the
      // same one-time-use refresh token and eventually desync the two.
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: ADMIN_SUPABASE_AUTH_STORAGE_KEY,
    },
  })
  store.__anvlAdminSupabaseClientEnvKey = envKey
  return store.__anvlAdminSupabaseClient!
}

export function disposeAdminSupabaseBrowserClient(): void {
  invalidateAdminAuthBootstrap()
  const store = adminClientStore()
  store.__anvlAdminSupabaseClient = null
  store.__anvlAdminSupabaseClientEnvKey = undefined
}

/** Drop in-memory client + persisted admin auth bucket. */
export function resetAdminSupabaseBrowserClient(): void {
  clearAdminSupabaseAuthStorage()
  disposeAdminSupabaseBrowserClient()
}
