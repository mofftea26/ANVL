import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { restRpc } from '@/features/cms/api/supabaseRest'
import {
  acceptTransferResultSchema,
  claimPassportResultSchema,
  initiateTransferResultSchema,
  ownedPassportSchema,
  passportViewSchema,
} from '../schemas/passport.schema'
import type {
  AcceptTransferResult,
  ClaimPassportInput,
  ClaimPassportResult,
  InitiateTransferResult,
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
export async function fetchPassportByTokenAnon(
  token: string,
  transferCode?: string,
): Promise<PassportView | null> {
  const env = getSupabasePublicEnv()
  if (!env) return null
  const { data, error } = await restRpc(env, 'get_passport_by_token', {
    p_token: token,
    p_transfer_code: transferCode ?? null,
  })
  if (error || data === null) return null
  const parsed = passportViewSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

/**
 * Browser token lookup that carries the user's session when present, so the
 * RPC can resolve `isOwner` and include owner-only fields. Falls back to the
 * anon path when signed out or unconfigured.
 */
export async function fetchPassportByToken(
  token: string,
  transferCode?: string,
): Promise<PassportView | null> {
  const client = await getAuthedClient()
  if (!client) return fetchPassportByTokenAnon(token, transferCode)
  const { data, error } = await client.rpc('get_passport_by_token', {
    p_token: token,
    p_transfer_code: transferCode ?? null,
  })
  if (error || data === null || data === undefined) {
    return fetchPassportByTokenAnon(token, transferCode)
  }
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

/** Owner toggles whether their passport is publicly verifiable with their name. */
export async function setPassportVisibility(token: string, isPublic: boolean): Promise<boolean> {
  const client = await getAuthedClient()
  if (!client) return false
  const { data, error } = await client.rpc('set_passport_visibility', {
    p_token: token,
    p_public: isPublic,
  })
  return !error && Boolean((data as { ok?: boolean } | null)?.ok)
}

/** Owner mints a one-time transfer code (7-day expiry, replaces any pending). */
export async function initiatePassportTransfer(token: string): Promise<InitiateTransferResult> {
  const client = await getAuthedClient()
  if (!client) return { ok: false, error: 'not_authenticated' }
  const { data, error } = await client.rpc('initiate_passport_transfer', { p_token: token })
  if (error) return { ok: false, error: 'not_owner' }
  const parsed = initiateTransferResultSchema.safeParse(data)
  return parsed.success ? parsed.data : { ok: false, error: 'not_owner' }
}

/** Owner voids the pending transfer code. */
export async function cancelPassportTransfer(token: string): Promise<boolean> {
  const client = await getAuthedClient()
  if (!client) return false
  const { data, error } = await client.rpc('cancel_passport_transfer', { p_token: token })
  return !error && Boolean((data as { ok?: boolean } | null)?.ok)
}

/** Recipient accepts a transfer — atomically re-forges the passport to them. */
export async function acceptPassportTransfer(input: {
  token: string
  code: string
  displayName: string
}): Promise<AcceptTransferResult> {
  const client = await getAuthedClient()
  if (!client) return { ok: false, error: 'not_authenticated' }
  const { data, error } = await client.rpc('accept_passport_transfer', {
    p_token: input.token,
    p_code: input.code,
    p_display_name: input.displayName,
  })
  if (error) return { ok: false, error: 'transfer_invalid' }
  const parsed = acceptTransferResultSchema.safeParse(data)
  return parsed.success ? parsed.data : { ok: false, error: 'transfer_invalid' }
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
