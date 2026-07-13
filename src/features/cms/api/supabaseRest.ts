import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

/**
 * Minimal Supabase PostgREST access over plain `fetch` — no `@supabase/supabase-js`.
 *
 * The storefront's public read/write paths (published projection, coming-soon
 * signup) only need a single-row select and an insert, both under anon RLS.
 * Using `fetch` here keeps the ~140KB-gzip supabase-js client out of the main
 * storefront bundle; the full client stays only where it's genuinely needed
 * (admin auth, story reads — see `supabasePublicationClient.ts`).
 */

/** Error shape compatible with `isPostgrestMissingColumnError` (message + code). */
export type SupabaseRestError = { message?: string; code?: string }

function anonHeaders(
  env: SupabasePublicEnv,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    apikey: env.anonKey,
    Authorization: `Bearer ${env.anonKey}`,
    ...extra,
  }
}

async function readError(res: Response): Promise<SupabaseRestError> {
  try {
    const body = (await res.json()) as { message?: string; code?: string }
    return { message: body?.message, code: body?.code }
  } catch {
    return { message: `HTTP ${res.status}`, code: String(res.status) }
  }
}

/**
 * Select a single row (mirrors supabase-js `.eq(...).maybeSingle()`): returns
 * the first matching row or `null`, plus any PostgREST error.
 */
export async function restSelectMaybeSingle(
  env: SupabasePublicEnv,
  table: string,
  query: string,
): Promise<{ data: Record<string, unknown> | null; error: SupabaseRestError | null }> {
  try {
    const res = await fetch(`${env.url}/rest/v1/${table}?${query}`, {
      headers: anonHeaders(env, { Accept: 'application/json' }),
    })
    if (!res.ok) return { data: null, error: await readError(res) }
    const rows = (await res.json()) as unknown
    const row = Array.isArray(rows) ? (rows[0] ?? null) : null
    return { data: row as Record<string, unknown> | null, error: null }
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'network error' },
    }
  }
}

/**
 * Call a PostgREST RPC under the anon role. Returns the raw JSON result —
 * callers validate with Zod. Used by SSR-safe public reads (e.g. the product
 * passport token lookup) where the full supabase-js client is unnecessary.
 */
export async function restRpc(
  env: SupabasePublicEnv,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown; error: SupabaseRestError | null }> {
  try {
    const res = await fetch(`${env.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: anonHeaders(env, {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
      body: JSON.stringify(args),
    })
    if (!res.ok) return { data: null, error: await readError(res) }
    return { data: (await res.json()) as unknown, error: null }
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'network error' },
    }
  }
}

/** Insert a single row under anon RLS. */
export async function restInsert(
  env: SupabasePublicEnv,
  table: string,
  row: Record<string, unknown>,
): Promise<{ error: SupabaseRestError | null }> {
  try {
    const res = await fetch(`${env.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: anonHeaders(env, {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify(row),
    })
    if (!res.ok) return { error: await readError(res) }
    return { error: null }
  } catch (err) {
    return { error: { message: err instanceof Error ? err.message : 'network error' } }
  }
}
