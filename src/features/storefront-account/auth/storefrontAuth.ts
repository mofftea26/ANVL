import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { getStorefrontSupabaseClient } from './storefrontSupabaseClient'

export type StorefrontOAuthProvider = 'google' | 'facebook' | 'apple'

export type AuthResult =
  | { ok: true; userId: string | null; needsConfirmation?: boolean }
  | { ok: false; error: string }

/** True when Supabase is configured — gates the real auth path vs the mock flow. */
export function isStorefrontAuthEnabled(): boolean {
  return Boolean(getSupabasePublicEnv())
}

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
): Promise<AuthResult> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: originRedirect(),
    },
  })
  if (error) return { ok: false, error: error.message }
  // No session means email confirmation is required.
  return { ok: true, userId: data.user?.id ?? null, needsConfirmation: !data.session }
}

/**
 * Starts the OAuth flow — the browser redirects to the provider and returns to
 * `/account` with a session (parsed via `detectSessionInUrl`). The promise
 * usually does not resolve in-page because navigation occurs first.
 */
export async function signInWithOAuthStorefront(
  provider: StorefrontOAuthProvider,
): Promise<{ ok: boolean; error?: string }> {
  const client = getStorefrontSupabaseClient()
  if (!client) return { ok: false, error: 'Auth is not configured.' }
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: originRedirect() },
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
    redirectTo: originRedirect('/auth/sign-in'),
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
