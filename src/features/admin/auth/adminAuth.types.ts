export interface AdminCredentials {
  email: string
  password: string
  rememberMe: boolean
}

export interface AdminSession {
  userId: string
  email: string
  /** From Auth `user_metadata` or email local-part — see `supabaseUserDisplayLabel`. */
  displayName: string
  /** When this session was last verified against the server (login, mount, or heartbeat). */
  verifiedAt: string
}

export interface AdminAuthContextValue {
  isAuthenticated: boolean
  session: AdminSession | null
  /** True until the first server session check (on mount) resolves. */
  isBootstrapping: boolean
  /** False until the first remote CMS pull completes. */
  isRemoteCmsReady: boolean
  /** Background Supabase pull in progress — use for non-blocking sync UI only. */
  isRemoteSyncing: boolean
  /** Set when Supabase hydration throws (misconfigured schema, network, etc.). */
  remoteHydrateError: string | null
  login: (
    credentials: AdminCredentials,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
}
