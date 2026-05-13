export interface AdminCredentials {
  username: string
  password: string
}

export interface AdminSession {
  username: string
  loggedInAt: string
}

export interface AdminAuthContextValue {
  isAuthenticated: boolean
  session: AdminSession | null
  isHydrated: boolean
  login: (credentials: AdminCredentials) => { ok: true } | { ok: false; error: string }
  logout: () => void
}
