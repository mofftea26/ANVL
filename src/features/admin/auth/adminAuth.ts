import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  clearAdminSessionData,
  readAdminSessionData,
  writeAdminSessionData,
  type AdminSessionData,
} from '@/features/admin/auth/adminAuthSession.server'
import { createAdminServerSupabaseClient } from '@/features/admin/auth/adminAuthServerSupabaseClient'
import { csrfProtectionMiddleware } from '@/features/admin/auth/adminCsrf'
import {
  fetchCmsProfileRoleWithAccessToken,
  formatCmsAdminAccessDeniedReason,
} from '@/features/admin/auth/adminCmsProfileRole'
import { supabaseUserDisplayLabel } from '@/features/admin/auth/adminDisplayName'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

const SIGN_IN_TIMEOUT_MS = 20_000
const REFRESH_TIMEOUT_MS = 12_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      },
    )
  })
}

export interface AdminAuthUser {
  userId: string
  email: string
  displayName: string
}

/** Tokens are returned once, over the same authenticated response as the
 * cookie, so the client can hydrate its own (CMS-read-only) Supabase session
 * — see `AdminAuthProvider`. They are never persisted server-side. */
interface AdminSessionTokens {
  accessToken: string
  refreshToken: string
}

export type LoginAdminResult =
  | ({ ok: true; user: AdminAuthUser } & AdminSessionTokens)
  | { ok: false; error: string }

const loginInputSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
})

export const loginAdminServerFn = createServerFn({ method: 'POST' })
  .middleware([csrfProtectionMiddleware])
  .inputValidator((data: unknown) => loginInputSchema.parse(data))
  .handler(async ({ data }): Promise<LoginAdminResult> => {
    const client = createAdminServerSupabaseClient()
    const env = getSupabasePublicEnv()
    if (!client || !env) {
      return {
        ok: false,
        error:
          'Supabase is not configured on the server. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the server.',
      }
    }

    let signInResult
    try {
      signInResult = await withTimeout(
        client.auth.signInWithPassword({ email: data.email, password: data.password }),
        SIGN_IN_TIMEOUT_MS,
        'signInWithPassword',
      )
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Sign-in timed out. Try again.',
      }
    }

    const { data: signInData, error: signInError } = signInResult
    if (signInError || !signInData.user || !signInData.session) {
      return { ok: false, error: signInError?.message ?? 'Incorrect email or password.' }
    }

    const { user, session } = signInData
    const profile = await fetchCmsProfileRoleWithAccessToken(
      env.url,
      env.anonKey,
      session.access_token,
      user.id,
    )

    if (profile.role !== 'admin') {
      await client.auth.signOut()
      return { ok: false, error: formatCmsAdminAccessDeniedReason(profile, user.id) }
    }

    const displayName = supabaseUserDisplayLabel(user)
    const sessionData: AdminSessionData = {
      userId: user.id,
      email: user.email ?? '',
      displayName,
      refreshToken: session.refresh_token,
      remember: data.rememberMe,
    }
    await writeAdminSessionData(sessionData)

    return {
      ok: true,
      user: { userId: user.id, email: user.email ?? '', displayName },
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    }
  })

export const logoutAdminServerFn = createServerFn({ method: 'POST' })
  .middleware([csrfProtectionMiddleware])
  .handler(async () => {
    const existing = await readAdminSessionData()
    if (existing?.refreshToken) {
      const client = createAdminServerSupabaseClient()
      if (client) {
        try {
          await withTimeout(
            client.auth.refreshSession({ refresh_token: existing.refreshToken }),
            REFRESH_TIMEOUT_MS,
            'refreshSession',
          )
          await client.auth.signOut()
        } catch {
          // Best-effort revoke — the cookie is cleared regardless below.
        }
      }
    }
    await clearAdminSessionData()
    return { ok: true as const }
  })

export type AdminSessionResult =
  | ({ authenticated: true; user: AdminAuthUser } & AdminSessionTokens)
  | { authenticated: false }

/**
 * Shared "am I logged in" check — called from `beforeLoad` (SSR + client
 * navigation) and from the client on mount. Every successful call refreshes
 * the Supabase session and re-issues the sealed cookie with the rotated
 * refresh token (Supabase rotates refresh tokens on use), which is what keeps
 * a "remember me" session alive across the 30-day window without ever
 * exposing the refresh token to client JS.
 */
export async function validateAdminSessionFromCookie(): Promise<AdminSessionResult> {
  const existing = await readAdminSessionData()
  if (!existing) return { authenticated: false }

  const client = createAdminServerSupabaseClient()
  const env = getSupabasePublicEnv()
  if (!client || !env) return { authenticated: false }

  let refreshResult
  try {
    refreshResult = await withTimeout(
      client.auth.refreshSession({ refresh_token: existing.refreshToken }),
      REFRESH_TIMEOUT_MS,
      'refreshSession',
    )
  } catch {
    await clearAdminSessionData()
    return { authenticated: false }
  }

  const { data, error } = refreshResult
  if (error || !data.user || !data.session) {
    await clearAdminSessionData()
    return { authenticated: false }
  }

  const profile = await fetchCmsProfileRoleWithAccessToken(
    env.url,
    env.anonKey,
    data.session.access_token,
    data.user.id,
  )
  if (profile.role !== 'admin') {
    await clearAdminSessionData()
    return { authenticated: false }
  }

  const displayName = supabaseUserDisplayLabel(data.user)
  await writeAdminSessionData({
    userId: data.user.id,
    email: data.user.email ?? '',
    displayName,
    refreshToken: data.session.refresh_token,
    remember: existing.remember,
  })

  return {
    authenticated: true,
    user: { userId: data.user.id, email: data.user.email ?? '', displayName },
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}

export const getAdminSessionServerFn = createServerFn({ method: 'GET' }).handler(
  validateAdminSessionFromCookie,
)
