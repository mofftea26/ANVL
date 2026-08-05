import { getStorefrontSupabaseClient } from './storefrontSupabaseClient'
import { isStorefrontAuthEnabled } from './storefrontAuthEnabled'

// Re-exported so every existing `from './storefrontAuth'` / barrel import keeps
// working. Callers on a hot path should import it from `./storefrontAuthEnabled`
// directly — see that file for why.
export { isStorefrontAuthEnabled }

export type StorefrontOAuthProvider = 'google' | 'facebook' | 'apple'

export type AuthResult =
  | { ok: true; userId: string | null; needsConfirmation?: boolean }
  | { ok: false; error: string }

function originRedirect(path = '/account'): string | undefined {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}${path}`
}

export async function signInWithPasswordStorefront(
  email: string,
  password: string,
): Promise<AuthResult> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? 'Could not sign in.' }
  }
  return { ok: true, userId: data.user.id }
}

export async function signUpStorefront(
  email: string,
  password: string,
  fullName?: string,
  redirect?: string,
): Promise<AuthResult> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      // The confirmation link lands on /auth/callback, which forwards to the
      // (sanitized) redirect — so "scan QR → sign up → confirm email" returns
      // to the passport instead of stranding on /account.
      emailRedirectTo: originRedirect(buildOAuthCallbackPath(redirect)),
    },
  })
  if (error) return { ok: false, error: error.message }
  // No session means email confirmation is required.
  return { ok: true, userId: data.user?.id ?? null, needsConfirmation: !data.session }
}

/** Resend the sign-up confirmation email. */
export async function resendVerificationStorefront(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { error } = await client.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: originRedirect('/auth/callback') },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Set a new password for the signed-in user (used after recovery + in settings). */
export async function updatePasswordStorefront(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { error } = await client.auth.updateUser({ password })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Builds the OAuth callback path, carrying the post-sign-in destination as a
 * `?redirect=` param so it survives the provider round trip. `/auth/callback`
 * sanitizes it via `sanitizeInternalRedirect` before navigating. Exported for
 * unit tests.
 */
export function buildOAuthCallbackPath(redirect?: string): string {
  if (!redirect) return '/auth/callback'
  return `/auth/callback?redirect=${encodeURIComponent(redirect)}`
}

/**
 * Starts the OAuth flow — the browser redirects to the provider and returns to
 * `/auth/callback` with a session (parsed via `detectSessionInUrl`), which then
 * forwards to `redirect` (sanitized; defaults to /account). The promise
 * usually does not resolve in-page because navigation occurs first.
 *
 * Note: the Supabase Auth redirect allow-list must permit
 * `<origin>/auth/callback` with query params (a `/auth/callback*` wildcard).
 */
export async function signInWithOAuthStorefront(
  provider: StorefrontOAuthProvider,
  redirect?: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: originRedirect(buildOAuthCallbackPath(redirect)) },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function sendPasswordResetStorefront(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: originRedirect('/auth/reset-password'),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function signOutStorefront(): Promise<void> {
  const client = getStorefrontSupabaseClient()
  if (client) await client.auth.signOut()
}

/** Current Supabase user id, or null when signed out / not configured. */
export async function getStorefrontUserId(): Promise<string | null> {
  const client = getStorefrontSupabaseClient()
  if (!client) return null
  const { data } = await client.auth.getSession()
  return data.session?.user.id ?? null
}

/** Current signed-in user's email (for linking a checkout to the account). */
export async function getStorefrontUserEmail(): Promise<string | null> {
  const client = getStorefrontSupabaseClient()
  if (!client) return null
  const { data } = await client.auth.getSession()
  return data.session?.user.email ?? null
}
