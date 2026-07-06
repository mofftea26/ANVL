import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

/**
 * Double-submit-cookie CSRF protection for the admin session's
 * cookie-authenticated server functions (`loginAdminServerFn`,
 * `logoutAdminServerFn` — the only two; every other admin mutation writes
 * directly to Supabase from the browser with a bearer-token Authorization
 * header, which isn't attacker-forgeable cross-site the way an
 * automatically-attached cookie is, so it isn't a CSRF target).
 *
 * Note: the session cookie itself already sets `sameSite: 'lax'`
 * (`adminAuthSession.server.ts`), which already blocks the classic
 * auto-submitting-form CSRF attack (SameSite=Lax cookies aren't sent on
 * cross-site POST). This is defense-in-depth on top of that, not the sole
 * protection layer — kept simple (a plain random token, not sealed/signed)
 * since it only needs to prove "the page that made this request could read
 * this origin's cookies," not carry any sensitive payload itself.
 */
export const CSRF_COOKIE_NAME = 'anvl_admin_csrf'
export const CSRF_HEADER_NAME = 'x-anvl-csrf-token'

export function readCsrfCookieFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function readCsrfCookieFromDocument(): string | null {
  if (typeof document === 'undefined') return null
  return readCsrfCookieFromHeader(document.cookie)
}

/** Pure double-submit comparison — extracted so it's testable without mocking the middleware chain. */
export function verifyCsrfTokens(
  cookieHeader: string | null,
  headerToken: string | null,
): boolean {
  const cookieToken = readCsrfCookieFromHeader(cookieHeader)
  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

/**
 * Attach to any cookie-authenticated, state-mutating server function via
 * `.middleware([csrfProtectionMiddleware])`. Client phase echoes the cookie
 * back as a header; server phase verifies they match.
 */
export const csrfProtectionMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    const token = readCsrfCookieFromDocument()
    return next({ headers: token ? { [CSRF_HEADER_NAME]: token } : {} })
  })
  .server(async ({ next }) => {
    const valid = verifyCsrfTokens(
      getRequestHeader('cookie') ?? null,
      getRequestHeader(CSRF_HEADER_NAME) ?? null,
    )
    if (!valid) {
      throw new Error('CSRF validation failed — refresh the page and try again.')
    }
    return next()
  })
