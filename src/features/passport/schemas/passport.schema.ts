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
  }))

export type OwnedPassport = z.infer<typeof ownedPassportSchema>

