import {
  getAdminSessionServerFn,
  type AdminSessionResult,
} from '@/features/admin/auth/adminAuth'

/**
 * How long a successful admin-session check is trusted before the next
 * caller triggers a fresh server round trip. Short enough that a real
 * session drop (logout in another tab, a revoked CMS role) is caught well
 * within a normal admin working session; long enough to absorb the burst of
 * calls a single `/admin` navigation produces (see below).
 */
const ADMIN_SESSION_CACHE_TTL_MS = 45_000

interface AdminSessionCacheEntry {
  /** The in-flight (or already-settled) request. Shared by reference so
   * concurrent callers await the SAME promise instead of each firing their
   * own request. */
  promise: Promise<AdminSessionResult>
  /** `null` while `promise` is still in flight. Set the moment it resolves
   * to a successful, authenticated result — that timestamp is what the TTL
   * is measured from. */
  resolvedAt: number | null
}

/** Module-scoped cache. Deliberately never touched when running on the
 * server — see the `typeof window === 'undefined'` guard in
 * `getCachedAdminSession` below. */
let cacheEntry: AdminSessionCacheEntry | null = null

function isEntryUsable(entry: AdminSessionCacheEntry): boolean {
  // Not yet resolved (in flight) is always usable — this is what collapses
  // concurrent callers (hover-preload intent, a click navigation, the
  // AdminAuthProvider mount effect, the heartbeat) onto a single request
  // instead of each independently calling `refreshSession` against Supabase,
  // which would race to rotate the same one-time-use refresh token.
  if (entry.resolvedAt === null) return true
  return Date.now() - entry.resolvedAt < ADMIN_SESSION_CACHE_TTL_MS
}

/**
 * Shared, promise-caching wrapper around `getAdminSessionServerFn`.
 *
 * TanStack Router does not gate `beforeLoad` on staleness the way it gates
 * loaders, so `/admin/route.tsx`'s guard re-runs on every single client-side
 * navigation within `/admin` — each run awaiting a sequential Supabase
 * `refreshSession()` + `cms_profiles` role fetch + cookie re-seal. Without
 * this cache, a single `/admin` navigation (hover-preload firing `intent`,
 * the click itself, `AdminAuthProvider`'s mount check, and its 10-minute
 * heartbeat) could each independently trigger that whole chain.
 *
 * Callers that need to force a real check regardless of cache state (the
 * heartbeat) pass `{ force: true }`.
 *
 * CRITICAL — SSR SAFETY: this app runs SSR on Cloudflare Workers, where a
 * single `workerd` isolate is reused across requests from different users.
 * A server-side cache here would risk serving one admin's authenticated
 * session to a different user's request on the same isolate. The cache is
 * therefore bypassed ENTIRELY when `window` is undefined — every server call
 * goes straight to `getAdminSessionServerFn()`, uncached, every time.
 */
export async function getCachedAdminSession(
  options?: { force?: boolean },
): Promise<AdminSessionResult> {
  if (typeof window === 'undefined') {
    return getAdminSessionServerFn()
  }

  if (!options?.force && cacheEntry && isEntryUsable(cacheEntry)) {
    return cacheEntry.promise
  }

  const promise = getAdminSessionServerFn()
  const entry: AdminSessionCacheEntry = { promise, resolvedAt: null }
  cacheEntry = entry

  try {
    const result = await promise
    if (cacheEntry === entry) {
      // Only a successful, authenticated result is worth trusting for the
      // TTL window. Caching an unauthenticated result would risk keeping a
      // signed-out user "logged in" (from the cache's point of view) for up
      // to 45s; caching nothing just means the next caller re-checks.
      cacheEntry = result.authenticated ? { promise, resolvedAt: Date.now() } : null
    }
    return result
  } catch (error) {
    if (cacheEntry === entry) cacheEntry = null
    throw error
  }
}

/**
 * Drops the cached session so the next `getCachedAdminSession()` call is
 * forced to hit the server. Called on logout (the cached "authenticated"
 * value must not survive it) and whenever an admin Supabase call comes back
 * unauthorized — `AdminAuthProvider.refreshSession` clears the cache the
 * moment `getCachedAdminSession` reports `authenticated: false`, since that
 * is this app's signal that the session died server-side.
 */
export function invalidateAdminSessionCache(): void {
  cacheEntry = null
}
