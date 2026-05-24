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
      persistSession: true,
      autoRefreshToken: true,
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
