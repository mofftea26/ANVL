import { z } from 'zod'

/**
 * Product passport read models. The Supabase RPCs (`get_passport_by_token`,
 * `claim_passport`) return snake_case jsonb; these schemas are the single
 * source of truth for parsing that into camelCase view types (z.infer only —
 * no duplicated interfaces).
 */

export const passportViewSchema = z
  .object({
    product_slug: z.string().min(1),
    product_name: z.string().min(1),
    serial_number: z.number().int().positive(),
    edition_total: z.number().int().positive(),
    is_claimed: z.boolean(),
    is_owner: z.boolean(),
    claimed_display_name: z.string().nullable().catch(null),
    claimed_at: z.string().nullable().catch(null),
    claimed_color: z.string().nullable().catch(null),
    claimed_size: z.string().nullable().catch(null),
    // Owner-controlled visibility (absent from claim/accept payloads → default).
    is_public: z.boolean().default(false).catch(false),
    // Transfer state (absent from claim/accept RPC payloads → defaults).
    is_transfer_pending: z.boolean().default(false).catch(false),
    transfer_valid: z.boolean().default(false).catch(false),
  })
  .transform((raw) => ({
    productSlug: raw.product_slug,
    productName: raw.product_name,
    serialNumber: raw.serial_number,
    editionTotal: raw.edition_total,
    isClaimed: raw.is_claimed,
    isOwner: raw.is_owner,
    claimedDisplayName: raw.claimed_display_name,
    claimedAt: raw.claimed_at,
    claimedColor: raw.claimed_color,
    claimedSize: raw.claimed_size,
    isPublic: raw.is_public,
    isTransferPending: raw.is_transfer_pending,
    transferValid: raw.transfer_valid,
  }))

export type PassportView = z.infer<typeof passportViewSchema>

export const claimPassportErrorSchema = z.enum([
  'not_found',
  'already_claimed',
  'not_authenticated',
  'invalid_input',
])
export type ClaimPassportError = z.infer<typeof claimPassportErrorSchema>

export const claimPassportResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), passport: passportViewSchema }),
  z.object({ ok: z.literal(false), error: claimPassportErrorSchema }),
])
export type ClaimPassportResult = z.infer<typeof claimPassportResultSchema>

export const claimPassportInputSchema = z.object({
  token: z.string().min(8).max(128),
  color: z.string().min(1).max(80),
  size: z.string().min(1).max(40),
  displayName: z.string().min(1).max(120),
})
export type ClaimPassportInput = z.infer<typeof claimPassportInputSchema>

export const initiateTransferResultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    code: z.string().min(8),
    expires_at: z.string(),
  }),
  z.object({
    ok: z.literal(false),
    error: z.enum(['not_authenticated', 'not_owner']).catch('not_owner'),
  }),
])
export type InitiateTransferResult = z.infer<typeof initiateTransferResultSchema>

export const acceptTransferErrorSchema = z.enum([
  'not_authenticated',
  'invalid_input',
  'transfer_invalid',
])
export type AcceptTransferError = z.infer<typeof acceptTransferErrorSchema>

export const acceptTransferResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), passport: passportViewSchema }),
  z.object({ ok: z.literal(false), error: acceptTransferErrorSchema }),
])
export type AcceptTransferResult = z.infer<typeof acceptTransferResultSchema>

/** Row shape for the owner's Armory list (RLS `product_passports_select_own`). */
export const ownedPassportSchema = z
  .object({
    id: z.string(),
    token: z.string(),
    product_slug: z.string(),
    product_name: z.string(),
    serial_number: z.number().int(),
    edition_total: z.number().int(),
    claimed_at: z.string().nullable().catch(null),
    claimed_color: z.string().nullable().catch(null),
    claimed_size: z.string().nullable().catch(null),
    // Phase G life fields (defaults keep pre-migration rows parseable).
    wear_count: z.number().int().min(0).default(0).catch(0),
    last_worn_at: z.string().nullable().default(null).catch(null),
    featured_slot: z.number().int().min(1).max(3).nullable().default(null).catch(null),
    is_public: z.boolean().default(false).catch(false),
  })
  .transform((raw) => ({
    id: raw.id,
    token: raw.token,
    productSlug: raw.product_slug,
    productName: raw.product_name,
    serialNumber: raw.serial_number,
    editionTotal: raw.edition_total,
    claimedAt: raw.claimed_at,
    claimedColor: raw.claimed_color,
    claimedSize: raw.claimed_size,
    wearCount: raw.wear_count,
    lastWornAt: raw.last_worn_at,
    featuredSlot: raw.featured_slot,
    isPublic: raw.is_public,
  }))

export type OwnedPassport = z.infer<typeof ownedPassportSchema>

/** A logged achievement in the owner's Armory ("Deadlift PR — 240 kg"). */
export const armoryFeatSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1),
    achieved_on: z.string(),
    is_public: z.boolean().default(false).catch(false),
    // Optional piece the feat was earned in ("PR wearing this").
    product_slug: z.string().nullable().default(null).catch(null),
  })
  .transform((raw) => ({
    id: raw.id,
    title: raw.title,
    achievedOn: raw.achieved_on,
    isPublic: raw.is_public,
    productSlug: raw.product_slug,
  }))

export type ArmoryFeat = z.infer<typeof armoryFeatSchema>

export const armoryFeatInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  achievedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isPublic: z.boolean(),
  productSlug: z.string().nullable(),
})
export type ArmoryFeatInput = z.infer<typeof armoryFeatInputSchema>

/** Own armory-share state (read from the owner's profile row). */
export const armoryShareSchema = z
  .object({
    armory_public: z.boolean().default(false).catch(false),
    armory_handle: z.string().nullable().default(null).catch(null),
  })
  .transform((raw) => ({ isPublic: raw.armory_public, handle: raw.armory_handle }))
export type ArmoryShare = z.infer<typeof armoryShareSchema>

/**
 * The anon projection of an opted-in public armory (`get_public_armory`).
 * Only what the owner chose to show — no tokens, serials, ids or emails.
 */
export const publicArmorySchema = z
  .object({
    owner_name: z.string().min(1),
    total_pieces: z.number().int().min(0),
    pieces: z
      .array(
        z
          .object({
            product_slug: z.string(),
            product_name: z.string(),
            claimed_at: z.string().nullable().catch(null),
            claimed_color: z.string().nullable().catch(null),
            claimed_size: z.string().nullable().catch(null),
            wear_count: z.number().int().min(0).default(0).catch(0),
            featured_slot: z.number().int().nullable().default(null).catch(null),
          })
          .transform((p) => ({
            productSlug: p.product_slug,
            productName: p.product_name,
            claimedAt: p.claimed_at,
            claimedColor: p.claimed_color,
            claimedSize: p.claimed_size,
            wearCount: p.wear_count,
            featuredSlot: p.featured_slot,
          })),
      )
      .default([]),
    feats: z
      .array(
        z
          .object({
            title: z.string(),
            achieved_on: z.string(),
            product_slug: z.string().nullable().default(null).catch(null),
          })
          .transform((f) => ({
            title: f.title,
            achievedOn: f.achieved_on,
            productSlug: f.product_slug,
          })),
      )
      .default([]),
  })
  .transform((raw) => ({
    ownerName: raw.owner_name,
    totalPieces: raw.total_pieces,
    pieces: raw.pieces,
    feats: raw.feats,
  }))

export type PublicArmory = z.infer<typeof publicArmorySchema>

/** One PDP review from `get_product_reviews` (owner-verified by the RPC). */
export const productReviewSchema = z
  .object({
    display_name: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    title: z.string().nullable().catch(null),
    body: z.string().min(1),
    created_at: z.string(),
    is_mine: z.boolean().default(false).catch(false),
  })
  .transform((raw) => ({
    displayName: raw.display_name,
    rating: raw.rating,
    title: raw.title,
    body: raw.body,
    createdAt: raw.created_at,
    isMine: raw.is_mine,
  }))

export type ProductReview = z.infer<typeof productReviewSchema>

