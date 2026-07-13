import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { restRpc } from '@/features/cms/api/supabaseRest'
import {
  claimPassportResultSchema,
  ownedPassportSchema,
  passportViewSchema,
} from '../schemas/passport.schema'
import type {
  ClaimPassportInput,
  ClaimPassportResult,
  OwnedPassport,
  PassportView,
} from '../schemas/passport.schema'

/**
 * Product passport data access.
 *
 * Reads never touch the table directly — token secrecy is enforced by the
 * `get_passport_by_token` SECURITY DEFINER RPC (no public SELECT on
 * `product_passports`). The anon lookup path uses the lightweight REST helper
 * (SSR-safe, no supabase-js); the claim + owner paths lazy-import the authed
 * storefront client so supabase-js stays out of the initial route chunk.
 */

const OWNED_SELECT =
  'id, token, product_slug, product_name, serial_number, edition_total, claimed_at, claimed_color, claimed_size'

async function getAuthedClient() {
  if (typeof window === 'undefined') return null
  const { getStorefrontSupabaseClient } = await import(
    '@/features/storefront-account/auth/storefrontSupabaseClient'
  )
  return getStorefrontSupabaseClient()
}

/**
 * Public/anon token lookup — safe projection only. Returns `null` when the
 * token is unknown or Supabase is not configured. Works on server and browser.
 */
export async function fetchPassportByTokenAnon(token: string): Promise<PassportView | null> {
  const env = getSupabasePublicEnv()
  if (!env) return null
  const { data, error } = await restRpc(env, 'get_passport_by_token', { p_token: token })
  if (error || data === null) return null
  const parsed = passportViewSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

/**
 * Browser token lookup that carries the user's session when present, so the
 * RPC can resolve `isOwner` and include owner-only fields. Falls back to the
 * anon path when signed out or unconfigured.
 */
export async function fetchPassportByToken(token: string): Promise<PassportView | null> {
  const client = await getAuthedClient()
  if (!client) return fetchPassportByTokenAnon(token)
  const { data, error } = await client.rpc('get_passport_by_token', { p_token: token })
  if (error || data === null || data === undefined) return fetchPassportByTokenAnon(token)
  const parsed = passportViewSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

/** Atomic first-claim via the `claim_passport` RPC. Requires a signed-in session. */
export async function claimPassport(input: ClaimPassportInput): Promise<ClaimPassportResult> {
  const client = await getAuthedClient()
  if (!client) return { ok: false, error: 'not_authenticated' }
  const { data, error } = await client.rpc('claim_passport', {
    p_token: input.token,
    p_color: input.color,
    p_size: input.size,
    p_display_name: input.displayName,
  })
  if (error) return { ok: false, error: 'invalid_input' }
  const parsed = claimPassportResultSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }
  return parsed.data
}

/** The signed-in user's claimed passports (Armory), newest claim first. */
export async function listOwnedPassports(): Promise<OwnedPassport[]> {
  const client = await getAuthedClient()
  if (!client) return []
  const { data, error } = await client
    .from('product_passports')
    .select(OWNED_SELECT)
    .order('claimed_at', { ascending: false })
  if (error || !Array.isArray(data)) return []
  const out: OwnedPassport[] = []
  for (const row of data) {
    const parsed = ownedPassportSchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}
