import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
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
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  disposeAdminSupabaseBrowserClient,
  getAdminSupabaseBrowserClient,
} from '@/features/admin/auth/adminSupabaseBrowserClient'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { hydrateAdminCmsFromSupabase } from '@/features/admin/cmsRemote/adminCmsHydration'

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(
  null,
)

function resolveAuthMode(): AdminAuthMode {
  return getSupabasePublicEnv() ? 'supabase' : 'legacy'
}

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isRemoteCmsReady, setIsRemoteCmsReady] = useState(false)
  const [remoteHydrateError, setRemoteHydrateError] = useState<string | null>(
    null,
  )

  const authMode = useMemo(() => resolveAuthMode(), [])

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

    const client = getAdminSupabaseBrowserClient()
    if (!client) {
      setIsRemoteCmsReady(true)
      setIsHydrated(true)
      return
    }

    let cancelled = false

    void (async () => {
      setRemoteHydrateError(null)
      const { data } = await client.auth.getSession()
      if (cancelled) return

      if (data.session) {
        const role = await fetchCmsProfileRole(client)
        if (cancelled) return
        if (role !== 'admin') {
          await client.auth.signOut()
          if (!cancelled) {
            setSession(null)
            setIsRemoteCmsReady(true)
            setIsHydrated(true)
          }
          return
        }
        try {
          await hydrateAdminCmsFromSupabase(client)
        } catch (e) {
          const msg =
            e instanceof Error
              ? e.message
              : 'Failed to load CMS data from Supabase.'
          await client.auth.signOut()
          if (!cancelled) {
            setRemoteHydrateError(msg)
            setSession(null)
            setIsRemoteCmsReady(true)
            setIsHydrated(true)
          }
          return
        }
        if (cancelled) return
        const u = data.session.user
        setSession({
          kind: 'supabase',
          email: u.email ?? '',
          userId: u.id,
          loggedInAt: new Date().toISOString(),
        })
      }
      if (!cancelled) {
        setIsRemoteCmsReady(true)
        setIsHydrated(true)
      }
    })()

    const { data: sub } = client.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (event === 'SIGNED_OUT' || !nextSession) {
          setSession(null)
          return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const role = await fetchCmsProfileRole(client)
          if (role !== 'admin') {
            await client.auth.signOut()
            setSession(null)
            return
          }
          if (event === 'SIGNED_IN') {
            try {
              await hydrateAdminCmsFromSupabase(client)
              setRemoteHydrateError(null)
            } catch (e) {
              const msg =
                e instanceof Error
                  ? e.message
                  : 'Failed to load CMS data from Supabase.'
              setRemoteHydrateError(msg)
              await client.auth.signOut()
              setSession(null)
              return
            }
          }
          const u = nextSession.user
          setSession({
            kind: 'supabase',
            email: u.email ?? '',
            userId: u.id,
            loggedInAt: new Date().toISOString(),
          })
        }
      },
    )

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [authMode])

  const login = useCallback(
    async (credentials: AdminCredentials) => {
      if (authMode === 'supabase') {
        const client = getAdminSupabaseBrowserClient()
        if (!client) {
          return {
            ok: false as const,
            error:
              'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
          }
        }
        const email = credentials.username.trim()
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password: credentials.password,
        })
        if (error || !data.user) {
          return {
            ok: false as const,
            error: error?.message ?? 'Sign-in failed.',
          }
        }
        const role = await fetchCmsProfileRole(client)
        if (role !== 'admin') {
          await client.auth.signOut()
          return {
            ok: false as const,
            error:
              'This account is not an ANVL CMS admin. Ask an owner to set your role to admin in Supabase (cms_profiles).',
          }
        }
        try {
          await hydrateAdminCmsFromSupabase(client)
        } catch (e) {
          await client.auth.signOut()
          return {
            ok: false as const,
            error:
              e instanceof Error
                ? e.message
                : 'Failed to load CMS data from Supabase.',
          }
        }
        setRemoteHydrateError(null)
        setSession({
          kind: 'supabase',
          email: data.user.email ?? email,
          userId: data.user.id,
          loggedInAt: new Date().toISOString(),
        })
        return { ok: true as const }
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
    [authMode],
  )

  const logout = useCallback(async () => {
    if (authMode === 'supabase') {
      const client = getAdminSupabaseBrowserClient()
      await client?.auth.signOut()
      disposeAdminSupabaseBrowserClient()
    }
    clearAdminSession()
    setSession(null)
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
