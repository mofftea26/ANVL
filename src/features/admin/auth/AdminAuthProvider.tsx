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
  getAdminSessionServerFn,
  loginAdminServerFn,
  logoutAdminServerFn,
  type AdminAuthUser,
} from '@/features/admin/auth/adminAuth'
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

  const callGetSession = useServerFn(getAdminSessionServerFn)
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
  const applyAuthenticatedResult = useCallback((result: AuthenticatedResult) => {
    setSession({
      userId: result.user.userId,
      email: result.user.email,
      displayName: result.user.displayName,
      verifiedAt: new Date().toISOString(),
    })
    const client = getAdminSupabaseBrowserClient()
    if (client) {
      void client.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      })
    }
  }, [])

  const refreshSession = useCallback(
    async (opts?: { background?: boolean }) => {
      try {
        const result = await callGetSession()
        if (!result.authenticated) {
          setSession(null)
          return
        }
        applyAuthenticatedResult(result)
        startRemoteCmsPull(opts)
      } catch {
        // Network/timeout — keep existing state, next heartbeat retries.
      }
    },
    [applyAuthenticatedResult, callGetSession, startRemoteCmsPull],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await callGetSession()
        if (cancelled) return
        if (result.authenticated) {
          applyAuthenticatedResult(result)
          startRemoteCmsPull()
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
      applyAuthenticatedResult(result)
      startRemoteCmsPull()
      return { ok: true as const }
    },
    [applyAuthenticatedResult, callLogin, startRemoteCmsPull],
  )

  const logout = useCallback(async () => {
    remotePullGenerationRef.current += 1
    // A different admin may sign in next in this tab — drop the cached role.
    clearCmsProfileRoleCache()
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
