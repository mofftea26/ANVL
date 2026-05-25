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
      /** From Auth `user_metadata` or email local-part — see `supabaseUserDisplayLabel`. */
      displayName: string
      loggedInAt: string
    }

export type AdminAuthMode = 'supabase' | 'legacy'

export interface AdminAuthContextValue {
  isAuthenticated: boolean
  session: AdminSession | null
  isHydrated: boolean
  /** Supabase mode: false until the first remote CMS pull completes. Legacy: true once hydrated. */
  isRemoteCmsReady: boolean
  /** Background Supabase pull in progress — use for non-blocking sync UI only. */
  isRemoteSyncing: boolean
  /** Set when Supabase hydration throws (misconfigured schema, network, etc.). */
  remoteHydrateError: string | null
  authMode: AdminAuthMode
  login: (
    credentials: AdminCredentials,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}
