import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  clearAdminSession,
  isAdminLoginConfigured,
  readAdminSession,
  subscribeAdminAuthChange,
  writeAdminSession,
} from './adminAuth.storage'
import type {
  AdminAuthContextValue,
  AdminCredentials,
  AdminSession,
} from './adminAuth.types'

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(
  null,
)

/**
 * Dev-only admin authentication: credentials come from Vite env at build time
 * and ship in the client bundle. Replace with real server-backed sessions
 * before production.
 */
export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setSession(readAdminSession())
    setIsHydrated(true)
    const unsubscribe = subscribeAdminAuthChange(() => {
      setSession(readAdminSession())
    })
    return unsubscribe
  }, [])

  const login = useCallback(
    (credentials: AdminCredentials) => {
      if (!isAdminLoginConfigured) {
        return {
          ok: false as const,
          error:
            'Admin login is not configured. Set VITE_ANVL_ADMIN_PASSWORD in a `.env` file (see `.env.example`).',
        }
      }
      if (
        credentials.username.trim() === ADMIN_USERNAME &&
        credentials.password === ADMIN_PASSWORD
      ) {
        const nextSession: AdminSession = {
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
    [],
  )

  const logout = useCallback(() => {
    clearAdminSession()
    setSession(null)
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session),
      session,
      isHydrated,
      login,
      logout,
    }),
    [session, isHydrated, login, logout],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
