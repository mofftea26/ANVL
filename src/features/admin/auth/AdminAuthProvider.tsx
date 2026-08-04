import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useServerFn } from '@tanstack/react-start'
import {
  loginAdminServerFn,
  logoutAdminServerFn,
  type AdminAuthUser,
} from '@/features/admin/auth/adminAuth'
import {
  getCachedAdminSession,
  invalidateAdminSessionCache,
} from '@/features/admin/auth/adminAuthCache'
import type {
  AdminAuthContextValue,
  AdminCredentials,
  AdminSession,
} from '@/features/admin/auth/adminAuth.types'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { hydrateAdminCmsFromSupabase } from '@/features/admin/cmsRemote/adminCmsHydration'
import { clearCmsProfileRoleCache } from '@/features/admin/cmsRemote/adminCmsRemoteSync'

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

/**
 * Re-checks the server session and rotates the sealed cookie. Also doubles as
 * a heartbeat so a long single-page admin session (no navigation, so
 * `beforeLoad` never re-runs) still refreshes its Supabase access token
 * before the ~1hr GoTrue expiry.
 */
const SESSION_HEARTBEAT_MS = 10 * 60 * 1000

interface AuthenticatedResult {
  user: AdminAuthUser
  accessToken: string
  refreshToken: string
}

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isRemoteCmsReady, setIsRemoteCmsReady] = useState(false)
  const [isRemoteSyncing, setIsRemoteSyncing] = useState(false)
  const [remoteHydrateError, setRemoteHydrateError] = useState<string | null>(
    null,
  )

  const remotePullGenerationRef = useRef(0)
  const hasCompletedInitialRemotePullRef = useRef(false)
  const lastBackgroundPullAtRef = useRef(0)

  const callLogin = useServerFn(loginAdminServerFn)
  const callLogout = useServerFn(logoutAdminServerFn)

  const startRemoteCmsPull = useCallback((opts?: { background?: boolean }) => {
    const client = getAdminSupabaseBrowserClient()
    if (!client) {
      setIsRemoteCmsReady(true)
      return
    }
    const background = opts?.background ?? hasCompletedInitialRemotePullRef.current
    if (background) {
      const now = Date.now()
      if (now - lastBackgroundPullAtRef.current < 45_000) return
      lastBackgroundPullAtRef.current = now
    }

    const generation = remotePullGenerationRef.current + 1
    remotePullGenerationRef.current = generation
    if (background) {
      setIsRemoteSyncing(true)
    } else {
      setIsRemoteCmsReady(false)
    }
    setRemoteHydrateError(null)

    void (async () => {
      try {
        await hydrateAdminCmsFromSupabase(client)
        if (remotePullGenerationRef.current !== generation) return
        setRemoteHydrateError(null)
      } catch (e) {
        if (remotePullGenerationRef.current !== generation) return
        setRemoteHydrateError(
          e instanceof Error ? e.message : 'Failed to load CMS data from Supabase.',
        )
      } finally {
        if (remotePullGenerationRef.current === generation) {
          hasCompletedInitialRemotePullRef.current = true
          setIsRemoteCmsReady(true)
          setIsRemoteSyncing(false)
        }
      }
    })()
  }, [])

  /** Mirrors a freshly-validated server session into React state and hands
   * the client Supabase browser client its tokens (CMS-read bridge only —
   * see adminSupabaseBrowserClient.ts). */
  const applyAuthenticatedResult = useCallback(async (result: AuthenticatedResult) => {
    setSession({
      userId: result.user.userId,
      email: result.user.email,
      displayName: result.user.displayName,
      verifiedAt: new Date().toISOString(),
    })
    const client = getAdminSupabaseBrowserClient()
    if (client) {
      // AWAITED, deliberately. The browser client no longer persists its
      // session (`persistSession: false`, F-20), so there is no localStorage
      // copy to cover the window between "tokens arrived" and "client can
      // authenticate". Every caller runs `startRemoteCmsPull()` immediately
      // after this; firing that pull before the JWT is applied would hit RLS
      // unauthenticated and surface as "Failed to load CMS data from Supabase".
      await client.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      })
    }
  }, [])

  /**
   * The heartbeat is the only caller that forces a real network round trip
   * (`{ force: true }`) — everything else, including the mount-time
   * bootstrap check below, shares whatever the cache already has in flight
   * or resolved. That sharing is what collapses the old "cold `/admin` load
   * fires this chain twice" bug: `route.tsx`'s `beforeLoad` guard and this
   * provider's mount effect both call `getCachedAdminSession()` around the
   * same tick, so they settle onto a single request instead of each racing
   * Supabase's refresh-token rotation independently.
   */
  const refreshSession = useCallback(
    async (opts?: { background?: boolean }) => {
      try {
        const result = await getCachedAdminSession(
          opts?.background ? { force: true } : undefined,
        )
        if (!result.authenticated) {
          // The session died server-side — do not let a stale cached
          // "authenticated" value linger for later callers.
          invalidateAdminSessionCache()
          setSession(null)
          return
        }
        await applyAuthenticatedResult(result)
        startRemoteCmsPull(opts)
      } catch {
        // Network/timeout — keep existing state, next heartbeat retries.
      }
    },
    [applyAuthenticatedResult, startRemoteCmsPull],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await getCachedAdminSession()
        if (cancelled) return
        if (result.authenticated) {
          await applyAuthenticatedResult(result)
          if (cancelled) return
          startRemoteCmsPull()
        } else {
          invalidateAdminSessionCache()
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // Mount-only bootstrap check — see the heartbeat effect below for ongoing refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!session) return
    const interval = window.setInterval(() => {
      void refreshSession({ background: true })
    }, SESSION_HEARTBEAT_MS)
    return () => window.clearInterval(interval)
  }, [session, refreshSession])

  const login = useCallback(
    async (credentials: AdminCredentials) => {
      const result = await callLogin({ data: credentials })
      if (!result.ok) {
        return { ok: false as const, error: result.error }
      }
      await applyAuthenticatedResult(result)
      startRemoteCmsPull()
      return { ok: true as const }
    },
    [applyAuthenticatedResult, callLogin, startRemoteCmsPull],
  )

  const logout = useCallback(async () => {
    remotePullGenerationRef.current += 1
    // A different admin may sign in next in this tab — drop the cached role.
    clearCmsProfileRoleCache()
    invalidateAdminSessionCache()
    await callLogout()
    const client = getAdminSupabaseBrowserClient()
    await client?.auth.signOut()
    setSession(null)
    setRemoteHydrateError(null)
    setIsRemoteCmsReady(true)
    setIsRemoteSyncing(false)
  }, [callLogout])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session),
      session,
      isBootstrapping,
      isRemoteCmsReady,
      isRemoteSyncing,
      remoteHydrateError,
      login,
      logout,
    }),
    [
      session,
      isBootstrapping,
      isRemoteCmsReady,
      isRemoteSyncing,
      remoteHydrateError,
      login,
      logout,
    ],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
