import { getSession, useSession, type SessionConfig } from '@tanstack/react-start/server'

export const ADMIN_SESSION_COOKIE_NAME = 'anvl_admin_session'
export const ADMIN_SESSION_REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

/**
 * Seal TTL used when "remember me" is off. This does not control the cookie's
 * `Max-Age` (omitted entirely so the browser treats it as a session cookie,
 * cleared on browser close) — it only bounds how long a sealed cookie would
 * still verify server-side if a browser ever resurrected it across a restart
 * (e.g. "continue where you left off" tab restore), as defense in depth.
 */
const ADMIN_SESSION_DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface AdminSessionData {
  userId: string
  email: string
  displayName: string
  refreshToken: string
  remember: boolean
}

function requireAdminSessionSecret(): string {
  const secret = process.env.ANVL_ADMIN_SESSION_SECRET
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      'ANVL_ADMIN_SESSION_SECRET is not set (or is shorter than 32 characters). ' +
        'Set it in the server environment — see .env.example.',
    )
  }
  return secret
}

/**
 * Cookie `path` is `/` (not `/admin`) on purpose: TanStack Start server
 * functions are invoked over HTTP via a shared `/_serverFn/*` RPC endpoint on
 * client-side navigation, not under `/admin/*` — scoping the cookie to
 * `/admin` would silently drop it on every client-invoked login/logout/whoami
 * call after the first SSR page load.
 */
function adminSessionConfig(remember: boolean): SessionConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    password: requireAdminSessionSecret(),
    name: ADMIN_SESSION_COOKIE_NAME,
    maxAge: remember
      ? ADMIN_SESSION_REMEMBER_MAX_AGE_SECONDS
      : ADMIN_SESSION_DEFAULT_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      ...(remember ? { maxAge: ADMIN_SESSION_REMEMBER_MAX_AGE_SECONDS } : {}),
    },
  }
}

/** Read-only peek — never rewrites the cookie. */
export async function readAdminSessionData(): Promise<AdminSessionData | null> {
  const session = await getSession<AdminSessionData>(adminSessionConfig(false))
  if (!session.data.refreshToken || !session.data.userId) return null
  return session.data as AdminSessionData
}

/** Writes/rotates the sealed session cookie, applying the caller's remember-me choice. */
export async function writeAdminSessionData(data: AdminSessionData): Promise<void> {
  const session = await useSession<AdminSessionData>(adminSessionConfig(data.remember))
  await session.update(data)
}

export async function clearAdminSessionData(): Promise<void> {
  const session = await useSession<AdminSessionData>(adminSessionConfig(false))
  await session.clear()
}
