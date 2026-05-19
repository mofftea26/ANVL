export interface AdminCredentials {
  /** Legacy: username. Supabase mode: email address. */
  username: string
  password: string
}

export type AdminSession =
  | { kind: 'legacy'; username: string; loggedInAt: string }
  | {
      kind: 'supabase'
      email: string
      userId: string
      loggedInAt: string
    }

export type AdminAuthMode = 'supabase' | 'legacy'

export interface AdminAuthContextValue {
  isAuthenticated: boolean
  session: AdminSession | null
  isHydrated: boolean
  /** Supabase mode: false until remote CMS rows are pulled into localStorage. Legacy: true once hydrated. */
  isRemoteCmsReady: boolean
  /** Set when Supabase hydration throws (misconfigured schema, network, etc.). */
  remoteHydrateError: string | null
  authMode: AdminAuthMode
  login: (
    credentials: AdminCredentials,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}
