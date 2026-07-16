import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { restRpc } from '@/features/cms/api/supabaseRest'
import {
  armoryFeatSchema,
  armoryShareSchema,
  productReviewSchema,
  publicArmorySchema,
} from '../schemas/passport.schema'
import type {
  ArmoryFeat,
  ArmoryFeatInput,
  ArmoryShare,
  ProductReview,
  PublicArmory,
} from '../schemas/passport.schema'

/**
 * Armory life data access (Phase G): wear journal, Feats, Hall of Honor,
 * public armory sharing, and verified-owner reviews.
 *
 * Same posture as the passport client — anon reads go through SECURITY
 * DEFINER RPCs (`get_public_armory`, `get_product_reviews`) that project only
 * safe fields; every write is an authed RPC or an RLS-scoped own-row query.
 */

async function getAuthedClient() {
  if (typeof window === 'undefined') return null
  const { getStorefrontSupabaseClient } = await import(
    '@/features/storefront-account/auth/storefrontSupabaseClient'
  )
  return getStorefrontSupabaseClient()
}

/* ------------------------------------------------------------------ wear --- */

export type LogWearResult =
  | { ok: true; wearCount: number }
  | { ok: false; error: 'cooldown'; wearCount: number; nextAt: string | null }
  | { ok: false; error: 'not_owner' | 'not_authenticated' | 'unknown' }

/** One tap of "Wore it" (+1) or its undo (-1). Wear is limited to once per 24h. */
export async function logPassportWear(id: string, delta: 1 | -1 = 1): Promise<LogWearResult> {
  const client = await getAuthedClient()
  if (!client) return { ok: false, error: 'not_authenticated' }
  const { data, error } = await client.rpc('log_passport_wear', { p_id: id, p_delta: delta })
  if (error) return { ok: false, error: 'unknown' }
  const result = data as
    | { ok?: boolean; wear_count?: number; error?: string; next_at?: string }
    | null
  if (result?.ok && typeof result.wear_count === 'number') {
    return { ok: true, wearCount: result.wear_count }
  }
  if (result?.error === 'cooldown') {
    return {
      ok: false,
      error: 'cooldown',
      wearCount: result.wear_count ?? 0,
      nextAt: result.next_at ?? null,
    }
  }
  const known = ['not_owner', 'not_authenticated'] as const
  return { ok: false, error: known.find((k) => k === result?.error) ?? 'unknown' }
}

/* --------------------------------------------------------- hall of honor --- */

/** Pin a piece to a Hall of Honor slot (1-3) or clear it (null). */
export async function setPassportFeatured(id: string, slot: 1 | 2 | 3 | null): Promise<boolean> {
  const client = await getAuthedClient()
  if (!client) return false
  const { data, error } = await client.rpc('set_passport_featured', { p_id: id, p_slot: slot })
  return !error && Boolean((data as { ok?: boolean } | null)?.ok)
}

/* ----------------------------------------------------------------- feats --- */

/** The signed-in user's Feats, newest achievement first. */
export async function listArmoryFeats(): Promise<ArmoryFeat[]> {
  const client = await getAuthedClient()
  if (!client) return []
  const { data, error } = await client
    .from('armory_feats')
    .select('id, title, achieved_on, is_public')
    .order('achieved_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error || !Array.isArray(data)) return []
  const out: ArmoryFeat[] = []
  for (const row of data) {
    const parsed = armoryFeatSchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

export async function createArmoryFeat(input: ArmoryFeatInput): Promise<boolean> {
  const client = await getAuthedClient()
  if (!client) return false
  const { error } = await client.from('armory_feats').insert({
    title: input.title,
    achieved_on: input.achievedOn,
    is_public: input.isPublic,
    product_slug: input.productSlug,
  })
  return !error
}

export async function updateArmoryFeat(id: string, input: ArmoryFeatInput): Promise<boolean> {
  const client = await getAuthedClient()
  if (!client) return false
  const { error } = await client
    .from('armory_feats')
    .update({
      title: input.title,
      achieved_on: input.achievedOn,
      is_public: input.isPublic,
      product_slug: input.productSlug,
    })
    .eq('id', id)
  return !error
}

export async function deleteArmoryFeat(id: string): Promise<boolean> {
  const client = await getAuthedClient()
  if (!client) return false
  const { error } = await client.from('armory_feats').delete().eq('id', id)
  return !error
}

/* --------------------------------------------------------------- sharing --- */

/** Own share state (RLS own-row read on the profile). */
export async function getArmoryShare(): Promise<ArmoryShare | null> {
  const client = await getAuthedClient()
  if (!client) return null
  const { data: session } = await client.auth.getUser()
  const uid = session.user?.id
  if (!uid) return null
  const { data, error } = await client
    .from('storefront_profiles')
    .select('armory_public, armory_handle')
    .eq('id', uid)
    .maybeSingle()
  if (error || !data) return null
  const parsed = armoryShareSchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

/** Toggle public sharing; the handle is minted server-side on first enable. */
export async function setArmoryShare(isPublic: boolean): Promise<ArmoryShare | null> {
  const client = await getAuthedClient()
  if (!client) return null
  const { data, error } = await client.rpc('set_armory_share', { p_public: isPublic })
  if (error) return null
  const result = data as { ok?: boolean; handle?: string; public?: boolean } | null
  return result?.ok && typeof result.handle === 'string'
    ? { isPublic: Boolean(result.public), handle: result.handle }
    : null
}

/**
 * Anon lookup of a shared armory (SSR-safe — used by the /armory/$handle
 * loader). Unknown or disabled handles return null, indistinguishably.
 */
export async function fetchPublicArmory(handle: string): Promise<PublicArmory | null> {
  const env = getSupabasePublicEnv()
  if (!env) return null
  const { data, error } = await restRpc(env, 'get_public_armory', { p_handle: handle })
  if (error || data === null) return null
  const parsed = publicArmorySchema.safeParse(data)
  return parsed.success ? parsed.data : null
}

/* --------------------------------------------------------------- reviews --- */

/** Public review list for a PDP (anon-safe, SSR-safe). */
export async function fetchProductReviews(slug: string): Promise<ProductReview[]> {
  const env = getSupabasePublicEnv()
  if (!env) return []
  const { data, error } = await restRpc(env, 'get_product_reviews', { p_slug: slug })
  if (error || !Array.isArray(data)) return []
  const out: ProductReview[] = []
  for (const row of data) {
    const parsed = productReviewSchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

/** Browser review list that carries the session so `isMine` resolves. */
export async function fetchProductReviewsAuthed(slug: string): Promise<ProductReview[]> {
  const client = await getAuthedClient()
  if (!client) return fetchProductReviews(slug)
  const { data, error } = await client.rpc('get_product_reviews', { p_slug: slug })
  if (error || !Array.isArray(data)) return fetchProductReviews(slug)
  const out: ProductReview[] = []
  for (const row of data) {
    const parsed = productReviewSchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; error: 'not_authenticated' | 'not_verified_owner' | 'invalid_input' }

/** Upsert the signed-in owner's review — the RPC proves passport ownership. */
export async function submitProductReview(input: {
  slug: string
  rating: number
  title: string
  body: string
  displayName: string
}): Promise<SubmitReviewResult> {
  const client = await getAuthedClient()
  if (!client) return { ok: false, error: 'not_authenticated' }
  const { data, error } = await client.rpc('submit_product_review', {
    p_slug: input.slug,
    p_rating: input.rating,
    p_title: input.title || null,
    p_body: input.body,
    p_display_name: input.displayName,
  })
  if (error) return { ok: false, error: 'invalid_input' }
  const result = data as { ok?: boolean; error?: string } | null
  if (result?.ok) return { ok: true }
  const known = ['not_authenticated', 'not_verified_owner', 'invalid_input'] as const
  const code = known.find((k) => k === result?.error) ?? 'invalid_input'
  return { ok: false, error: code }
}

/** Remove the signed-in user's own review for a product (RLS-scoped). */
export async function deleteProductReview(slug: string): Promise<boolean> {
  const client = await getAuthedClient()
  if (!client) return false
  const { error } = await client.from('product_reviews').delete().eq('product_slug', slug)
  return !error
}
