import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  verifyAdminPassword,
  ADMIN_USERNAME,
  clearAdminSession,
  isAdminLoginConfigured,
  readAdminSession,
  subscribeAdminAuthChange,
  writeAdminSession,
} from './adminAuth.storage'
import type {
  AdminAuthContextValue,
  AdminAuthMode,
  AdminCredentials,
  AdminSession,
} from './adminAuth.types'
import {
  getSupabaseEnvIssue,
  isSupabaseAuthTarget,
} from '@/features/cms/api/supabasePublicEnv'
import {
  disposeAdminSupabaseBrowserClient,
  getAdminAuthBootstrapEpoch,
  getAdminSupabaseBrowserClient,
  resetAdminSupabaseBrowserClient,
} from '@/features/admin/auth/adminSupabaseBrowserClient'
import {
  adminSessionFromSupabaseUser,
  assertSupabaseAdminAccess,
  BOOTSTRAP_WATCHDOG_MESSAGE,
  ensureAdminSupabaseSessionAttached,
  pullRemoteCmsForAdmin,
  readBootstrapAdminSession,
  signInAdminWithPassword,
  STALE_ADMIN_SESSION_MESSAGE,
} from '@/features/admin/auth/adminSupabaseAuthFlow'

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(
  null,
)

function resolveAuthMode(): AdminAuthMode {
  return isSupabaseAuthTarget() ? 'supabase' : 'legacy'
}

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isRemoteCmsReady, setIsRemoteCmsReady] = useState(false)
  const [remoteHydrateError, setRemoteHydrateError] = useState<string | null>(
    null,
  )

  const authMode = useMemo(() => resolveAuthMode(), [])
  const loginInFlightRef = useRef(false)
  const remotePullGenerationRef = useRef(0)

  const startRemoteCmsPull = useCallback(
    (client: NonNullable<ReturnType<typeof getAdminSupabaseBrowserClient>>) => {
      const generation = remotePullGenerationRef.current + 1
      remotePullGenerationRef.current = generation
      setIsRemoteCmsReady(false)
      setRemoteHydrateError(null)

      void (async () => {
        const result = await pullRemoteCmsForAdmin(client)
        if (remotePullGenerationRef.current !== generation) return
        if (!result.ok) {
          setRemoteHydrateError(result.error)
        } else {
          setRemoteHydrateError(null)
        }
        setIsRemoteCmsReady(true)
      })()
    },
    [],
  )

  useEffect(() => {
    if (authMode === 'legacy') {
      setSession(readAdminSession())
      setIsRemoteCmsReady(true)
      setIsHydrated(true)
      const unsubscribe = subscribeAdminAuthChange(() => {
        setSession(readAdminSession())
      })
      return unsubscribe
    }

    let client = getAdminSupabaseBrowserClient()
    if (!client) {
      const envIssue = getSupabaseEnvIssue()
      if (envIssue) {
        setRemoteHydrateError(envIssue)
      }
      setIsRemoteCmsReady(true)
      setIsHydrated(true)
      return
    }

    let cancelled = false
    let timedOut = false
    const bootstrapEpoch = getAdminAuthBootstrapEpoch()
    const BOOTSTRAP_TIMEOUT_MS = 120_000
    let timeoutId: number | undefined
    let bootstrapFinished = false

    const cancelBootstrapWatchdog = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
    }

    const finishAuthBootstrap = () => {
      if (bootstrapFinished) return
      bootstrapFinished = true
      cancelBootstrapWatchdog()
      setIsHydrated(true)
    }

    timeoutId = window.setTimeout(() => {
      if (cancelled || bootstrapFinished) return
      timedOut = true
      disposeAdminSupabaseBrowserClient()
      setRemoteHydrateError(BOOTSTRAP_WATCHDOG_MESSAGE)
      setIsRemoteCmsReady(true)
      finishAuthBootstrap()
    }, BOOTSTRAP_TIMEOUT_MS)

    void (async () => {
      setRemoteHydrateError(null)
      try {
        let bootstrap = await readBootstrapAdminSession(client)
        if (
          cancelled ||
          timedOut ||
          bootstrapEpoch !== getAdminAuthBootstrapEpoch()
        ) {
          return
        }

        if (bootstrap.bootstrapTimedOut) {
          disposeAdminSupabaseBrowserClient()
          client = getAdminSupabaseBrowserClient()
          if (!client) {
            setIsRemoteCmsReady(true)
            return
          }
        }

        if (bootstrap.staleStorageCleared) {
          const hadStoredSession = bootstrap.hadStoredSession
          resetAdminSupabaseBrowserClient()
          client = getAdminSupabaseBrowserClient()
          if (!client) {
            if (hadStoredSession) {
              setRemoteHydrateError(STALE_ADMIN_SESSION_MESSAGE)
            }
            setIsRemoteCmsReady(true)
            return
          }
          bootstrap = await readBootstrapAdminSession(client)
          if (
            cancelled ||
            timedOut ||
            bootstrapEpoch !== getAdminAuthBootstrapEpoch()
          ) {
            return
          }
          if (!bootstrap.session && hadStoredSession) {
            setRemoteHydrateError(STALE_ADMIN_SESSION_MESSAGE)
            setIsRemoteCmsReady(true)
            return
          }
        }

        const attached = bootstrap.session
        if (attached?.user && client) {
          cancelBootstrapWatchdog()
          const access = await assertSupabaseAdminAccess(client, attached.user, {
            skipSessionAttach: true,
            session: attached.access_token ? attached : null,
          })
          if (
            cancelled ||
            timedOut ||
            bootstrapEpoch !== getAdminAuthBootstrapEpoch()
          ) {
            return
          }
          if (!access.ok) {
            await client.auth.signOut()
            resetAdminSupabaseBrowserClient()
            client = getAdminSupabaseBrowserClient()
            if (!cancelled && !timedOut) {
              setRemoteHydrateError(access.error)
              setSession(null)
              setIsRemoteCmsReady(true)
            }
          } else if (!cancelled && !timedOut) {
            setSession(adminSessionFromSupabaseUser(access.user))
            startRemoteCmsPull(client)
          }
        } else if (!cancelled && !timedOut) {
          setIsRemoteCmsReady(true)
        }
      } finally {
        finishAuthBootstrap()
      }
    })()

    const { data: sub } = client.auth.onAuthStateChange(async (event, nextSession) => {
      const activeClient = getAdminSupabaseBrowserClient()
      if (!activeClient) return
      if (loginInFlightRef.current) return

      if (event === 'SIGNED_OUT') {
        remotePullGenerationRef.current += 1
        setSession(null)
        setIsRemoteCmsReady(true)
        setRemoteHydrateError(null)
        return
      }

      if (
        (event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED') &&
        nextSession?.user
      ) {
        const access = await assertSupabaseAdminAccess(
          activeClient,
          nextSession.user,
          { skipSessionAttach: true, session: nextSession },
        )
        if (!access.ok) {
          await activeClient.auth.signOut()
          resetAdminSupabaseBrowserClient()
          setRemoteHydrateError(access.error)
          setSession(null)
          setIsRemoteCmsReady(true)
          return
        }
        setSession(adminSessionFromSupabaseUser(access.user))
        startRemoteCmsPull(activeClient)
      }
    })

    return () => {
      cancelled = true
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
      sub.subscription.unsubscribe()
    }
  }, [authMode, startRemoteCmsPull])

  const login = useCallback(
    async (credentials: AdminCredentials) => {
      if (authMode === 'supabase') {
        const envIssue = getSupabaseEnvIssue()
        if (envIssue) {
          return { ok: false as const, error: envIssue }
        }

        disposeAdminSupabaseBrowserClient()
        const client = getAdminSupabaseBrowserClient()
        if (!client) {
          return {
            ok: false as const,
            error:
              'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the dev server.',
          }
        }

        loginInFlightRef.current = true
        try {
          const email = credentials.username.trim()
          const signedIn = await signInAdminWithPassword(client, {
            email,
            password: credentials.password,
          })
          if (!signedIn.ok) {
            return { ok: false as const, error: signedIn.error }
          }

          await ensureAdminSupabaseSessionAttached(client, signedIn.session)

          const access = await assertSupabaseAdminAccess(client, signedIn.user, {
            skipSessionAttach: true,
            fastRoleCheck: true,
            session: signedIn.session,
          })
          if (!access.ok) {
            void client.auth.signOut()
            resetAdminSupabaseBrowserClient()
            return { ok: false as const, error: access.error }
          }

          setRemoteHydrateError(null)
          setSession(adminSessionFromSupabaseUser(access.user))
          startRemoteCmsPull(client)
          return { ok: true as const }
        } finally {
          loginInFlightRef.current = false
        }
      }

      if (!isAdminLoginConfigured) {
        return {
          ok: false as const,
          error:
            'Admin login is not configured. Set VITE_ANVL_ADMIN_PASSWORD in a local .env file (see .env.example).',
        }
      }
      if (
        credentials.username.trim() === ADMIN_USERNAME &&
        verifyAdminPassword(credentials.password)
      ) {
        const nextSession: AdminSession = {
          kind: 'legacy',
          username: ADMIN_USERNAME,
          loggedInAt: new Date().toISOString(),
        }
        writeAdminSession(nextSession)
        setSession(nextSession)
        return { ok: true as const }
      }
      return {
        ok: false as const,
        error: 'Incorrect username or password.',
      }
    },
    [authMode, startRemoteCmsPull],
  )

  const logout = useCallback(async () => {
    remotePullGenerationRef.current += 1
    if (authMode === 'supabase') {
      const client = getAdminSupabaseBrowserClient()
      await client?.auth.signOut()
      resetAdminSupabaseBrowserClient()
    }
    clearAdminSession()
    setSession(null)
    setRemoteHydrateError(null)
    setIsRemoteCmsReady(true)
  }, [authMode])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session),
      session,
      isHydrated,
      isRemoteCmsReady,
      remoteHydrateError,
      authMode,
      login,
      logout,
    }),
    [
      session,
      isHydrated,
      isRemoteCmsReady,
      remoteHydrateError,
      authMode,
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
