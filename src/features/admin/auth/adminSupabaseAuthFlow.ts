import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { AdminSession } from '@/features/admin/auth/adminAuth.types'
import {
  hasAdminSupabaseAuthStorage,
} from '@/features/admin/auth/adminSupabaseBrowserClient'
import {
  fetchCmsProfileRole,
  fetchCmsProfileRoleWithAccessToken,
  formatCmsAdminAccessDeniedReason,
} from '@/features/admin/auth/adminCmsProfileRole'
import { supabaseUserDisplayLabel } from '@/features/admin/auth/adminDisplayName'
import { hydrateAdminCmsFromSupabase } from '@/features/admin/cmsRemote/adminCmsHydration'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

export const GET_SESSION_BOOTSTRAP_TIMEOUT_MS = 20_000
export const GET_SESSION_POST_LOGIN_TIMEOUT_MS = 8_000
export const CMS_PROFILE_READ_TIMEOUT_MS = 12_000
export const SIGN_IN_WITH_PASSWORD_TIMEOUT_MS = 20_000
export const SET_SESSION_AFTER_SIGN_IN_TIMEOUT_MS = 8_000

const SESSION_ATTACH_MAX_ATTEMPTS = 5
const SESSION_ATTACH_DELAY_MS = 80
const ROLE_READ_MAX_ATTEMPTS = 4
const ROLE_READ_DELAY_MS = 120

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms,
        )
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export function adminSessionFromSupabaseUser(user: User): AdminSession {
  return {
    kind: 'supabase',
    email: user.email ?? '',
    userId: user.id,
    displayName: supabaseUserDisplayLabel(user),
    loggedInAt: new Date().toISOString(),
  }
}

/**
 * Fast path for cold boot: one `getSession` with a timeout. If GoTrue hangs
 * (common with stale localStorage after switching anon ↔ publishable keys),
 * clear admin auth storage and continue logged-out.
 */
export async function readBootstrapAdminSession(
  client: SupabaseClient,
): Promise<{
  session: Session | null
  staleStorageCleared: boolean
  hadStoredSession: boolean
  /** True when `getSession` hit the bootstrap timeout (caller should dispose in-memory client). */
  bootstrapTimedOut?: boolean
}> {
  const hadStoredSession = hasAdminSupabaseAuthStorage()
  try {
    const { data, error } = await withTimeout(
      client.auth.getSession(),
      GET_SESSION_BOOTSTRAP_TIMEOUT_MS,
      'getSession',
    )
    if (error) {
      return { session: null, staleStorageCleared: false, hadStoredSession }
    }
    return {
      session: data.session ?? null,
      staleStorageCleared: false,
      hadStoredSession,
    }
  } catch {
    if (hadStoredSession) {
      try {
        const { data, error } = await withTimeout(
          client.auth.getUser(),
          8_000,
          'getUser',
        )
        if (!error && data.user) {
          return {
            session: { user: data.user } as Session,
            staleStorageCleared: false,
            hadStoredSession,
          }
        }
      } catch {
        /* fall through */
      }
    }
    return {
      session: null,
      staleStorageCleared: false,
      hadStoredSession,
      bootstrapTimedOut: true,
    }
  }
}

/**
 * After `signInWithPassword`, the GoTrue session can lag briefly. Retries only
 * when `expectedUserId` is set (post-login); bootstrap uses
 * {@link readBootstrapAdminSession} instead.
 */
export async function waitForSupabaseClientSession(
  client: SupabaseClient,
  expectedUserId?: string,
): Promise<Session | null> {
  const attempts = expectedUserId ? SESSION_ATTACH_MAX_ATTEMPTS : 1
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const { data } = await withTimeout(
        client.auth.getSession(),
        GET_SESSION_POST_LOGIN_TIMEOUT_MS,
        'getSession',
      )
      const session = data.session
      if (
        session &&
        (!expectedUserId || session.user.id === expectedUserId)
      ) {
        return session
      }
    } catch {
      return null
    }
    if (attempt < attempts - 1) {
      await sleep(SESSION_ATTACH_DELAY_MS * (attempt + 1))
    }
  }
  return null
}

/** Persists the sign-in session on the client without calling `getSession`. */
export async function ensureAdminSupabaseSessionAttached(
  client: SupabaseClient,
  session: Session | null,
): Promise<void> {
  if (!session?.access_token || !session.refresh_token) return
  try {
    await withTimeout(
      client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
      SET_SESSION_AFTER_SIGN_IN_TIMEOUT_MS,
      'setSession',
    )
  } catch {
    /* non-fatal — role read may still use the access token directly */
  }
}

async function readCmsProfileRoleForAccess(
  client: SupabaseClient,
  userId: string,
  options: {
    fastRoleCheck?: boolean
    session?: Session | null
  },
): Promise<Awaited<ReturnType<typeof fetchCmsProfileRole>>> {
  const readWithTimeout = async (
    read: () => Promise<Awaited<ReturnType<typeof fetchCmsProfileRole>>>,
  ) => {
    try {
      return await withTimeout(read(), CMS_PROFILE_READ_TIMEOUT_MS, 'cms_profiles')
    } catch (e) {
      return {
        role: null,
        selectError:
          e instanceof Error ? e.message : 'Timed out reading cms_profiles.',
      } as Awaited<ReturnType<typeof fetchCmsProfileRole>>
    }
  }

  const accessToken = options.session?.access_token
  if (accessToken) {
    const env = getSupabasePublicEnv()
    if (env) {
      return readWithTimeout(() =>
        fetchCmsProfileRoleWithAccessToken(
          env.url,
          env.anonKey,
          accessToken,
          userId,
        ),
      )
    }
  }

  if (options.fastRoleCheck) {
    return readWithTimeout(() => fetchCmsProfileRole(client, userId))
  }
  return fetchCmsProfileRoleWhenReady(client, userId)
}

export async function fetchCmsProfileRoleWhenReady(
  client: SupabaseClient,
  userId: string,
): Promise<ReturnType<typeof fetchCmsProfileRole>> {
  let last: Awaited<ReturnType<typeof fetchCmsProfileRole>> = {
    role: null,
    selectError: null,
  }
  for (let attempt = 0; attempt < ROLE_READ_MAX_ATTEMPTS; attempt += 1) {
    try {
      last = await withTimeout(
        fetchCmsProfileRole(client, userId),
        CMS_PROFILE_READ_TIMEOUT_MS,
        'cms_profiles',
      )
    } catch (e) {
      return {
        role: null,
        selectError:
          e instanceof Error ? e.message : 'Timed out reading cms_profiles.',
      }
    }
    if (last.role === 'admin' || last.selectError) {
      return last
    }
    if (attempt < ROLE_READ_MAX_ATTEMPTS - 1) {
      await sleep(ROLE_READ_DELAY_MS * (attempt + 1))
    }
  }
  return last
}

export type SupabaseAdminAccessResult =
  | { ok: true; user: User }
  | { ok: false; error: string }

export type AssertSupabaseAdminAccessOptions = {
  /** Skip waiting on `getSession` when the caller already has a trusted user (login / bootstrap). */
  skipSessionAttach?: boolean
  /** Single role read — used on login so failures surface quickly instead of retrying. */
  fastRoleCheck?: boolean
  /** When set, role is read via PostgREST + JWT (avoids GoTrue lock during login). */
  session?: Session | null
}

export async function assertSupabaseAdminAccess(
  client: SupabaseClient,
  user: User,
  options: AssertSupabaseAdminAccessOptions = {},
): Promise<SupabaseAdminAccessResult> {
  if (!options.skipSessionAttach) {
    await waitForSupabaseClientSession(client, user.id)
  }

  const profile = await readCmsProfileRoleForAccess(client, user.id, {
    fastRoleCheck: options.fastRoleCheck,
    session: options.session,
  })
  if (profile.role !== 'admin') {
    return {
      ok: false,
      error: formatCmsAdminAccessDeniedReason(profile, user.id),
    }
  }
  return { ok: true, user }
}

export async function pullRemoteCmsForAdmin(
  client: SupabaseClient,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await hydrateAdminCmsFromSupabase(client)
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : 'Failed to load CMS data from Supabase.',
    }
  }
}

export const STALE_ADMIN_SESSION_MESSAGE =
  'A previous Supabase sign-in could not be restored (stale session data was cleared). Sign in again.'

export const BOOTSTRAP_WATCHDOG_MESSAGE =
  'Connecting to Supabase timed out. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env, then reload.'

export type SignInWithPasswordResult =
  | {
      ok: true
      user: User
      session: Session | null
    }
  | { ok: false; error: string }

/** Password sign-in with a hard timeout so the UI cannot spin forever. */
export async function signInAdminWithPassword(
  client: SupabaseClient,
  credentials: { email: string; password: string },
): Promise<SignInWithPasswordResult> {
  try {
    const { data, error } = await withTimeout(
      client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      }),
      SIGN_IN_WITH_PASSWORD_TIMEOUT_MS,
      'signInWithPassword',
    )
    if (error || !data.user) {
      const message = error?.message ?? 'Sign-in failed.'
      if (/no api key found/i.test(message)) {
        return {
          ok: false,
          error:
            'Supabase rejected the request (missing API key). Check VITE_SUPABASE_PUBLISHABLE_KEY in .env and restart pnpm dev.',
        }
      }
      return { ok: false, error: message }
    }
    return { ok: true, user: data.user, session: data.session ?? null }
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : 'Sign-in timed out. Reload the page and try again.',
    }
  }
}
