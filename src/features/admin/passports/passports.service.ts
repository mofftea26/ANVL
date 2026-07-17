import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'

/**
 * Admin CRUD for `product_passports` (Story-service pattern: direct table
 * access on the admin browser client under editor/admin RLS, discriminated
 * Result unions, Zod at the write boundary).
 */

export type PassportResult<T> = { ok: true; data: T } | { ok: false; error: string }

const PASSPORT_SELECT =
  'id, token, batch_id, product_slug, product_name, serial_number, edition_total, claimed_by, claimed_at, claimed_color, claimed_size, claimed_email, claimed_display_name, created_at'

export const adminPassportRowSchema = z
  .object({
    id: z.string(),
    token: z.string(),
    batch_id: z.string(),
    product_slug: z.string(),
    product_name: z.string(),
    serial_number: z.number().int(),
    edition_total: z.number().int(),
    claimed_by: z.string().nullable().catch(null),
    claimed_at: z.string().nullable().catch(null),
    claimed_color: z.string().nullable().catch(null),
    claimed_size: z.string().nullable().catch(null),
    claimed_email: z.string().nullable().catch(null),
    claimed_display_name: z.string().nullable().catch(null),
    created_at: z.string(),
  })
  .transform((r) => ({
    id: r.id,
    token: r.token,
    batchId: r.batch_id,
    productSlug: r.product_slug,
    productName: r.product_name,
    serialNumber: r.serial_number,
    editionTotal: r.edition_total,
    claimedBy: r.claimed_by,
    claimedAt: r.claimed_at,
    claimedColor: r.claimed_color,
    claimedSize: r.claimed_size,
    claimedEmail: r.claimed_email,
    claimedDisplayName: r.claimed_display_name,
    createdAt: r.created_at,
  }))

export type AdminPassport = z.infer<typeof adminPassportRowSchema>

export const generateBatchInputSchema = z.object({
  productSlug: z.string().min(1).max(200),
  productName: z.string().min(1).max(300),
  quantity: z.number().int().min(1).max(500),
})
export type GenerateBatchInput = z.infer<typeof generateBatchInputSchema>

function client(): PassportResult<SupabaseClient> {
  const c = getAdminSupabaseBrowserClient()
  if (!c) return { ok: false, error: 'Sign in to manage passports.' }
  return { ok: true, data: c }
}

function parseRows(rows: unknown[]): AdminPassport[] {
  const out: AdminPassport[] = []
  for (const row of rows) {
    const parsed = adminPassportRowSchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

/** All passports, newest product batches first, serials ascending within. */
export async function listPassports(): Promise<PassportResult<AdminPassport[]>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data
    .from('product_passports')
    .select(PASSPORT_SELECT)
    .order('product_slug', { ascending: true })
    .order('serial_number', { ascending: true })
  if (res.error) return { ok: false, error: res.error.message }
  return { ok: true, data: parseRows(res.data ?? []) }
}

/**
 * Generate a batch of N passports for a product. Serials continue from the
 * product's current max; `edition_total` on the new rows is the new max
 * (earlier rows keep their historic denominator — "#17 of the first 100").
 */
export async function generateBatch(
  input: GenerateBatchInput,
): Promise<PassportResult<{ batchId: string; from: number; to: number }>> {
  const parsed = generateBatchInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid batch input.' }
  const c = client()
  if (!c.ok) return c
  const supabase = c.data
  const { productSlug, productName, quantity } = parsed.data

  const maxRes = await supabase
    .from('product_passports')
    .select('serial_number')
    .eq('product_slug', productSlug)
    .order('serial_number', { ascending: false })
    .limit(1)
  if (maxRes.error) return { ok: false, error: maxRes.error.message }
  const startSerial = (maxRes.data?.[0]?.serial_number ?? 0) + 1
  const editionTotal = startSerial - 1 + quantity

  const batchId = crypto.randomUUID()
  const rows = Array.from({ length: quantity }, (_, i) => ({
    token: crypto.randomUUID(),
    batch_id: batchId,
    product_slug: productSlug,
    product_name: productName,
    serial_number: startSerial + i,
    edition_total: editionTotal,
  }))

  const insertRes = await supabase.from('product_passports').insert(rows)
  if (insertRes.error) return { ok: false, error: insertRes.error.message }
  return {
    ok: true,
    data: { batchId, from: startSerial, to: startSerial - 1 + quantity },
  }
}

/**
 * Reset a claim so the passport becomes claimable again — and pristine. Runs
 * through the `admin_unassign_passport` SECURITY DEFINER RPC (editor/admin
 * verified server-side), which wipes the claimant and every bit of the owner's
 * Armory life on the piece (wear count, last-worn, Hall-of-Honor pin,
 * visibility, pending transfer). With `purgeFeats` it also deletes the
 * ex-owner's feats for that product — gone as if never owned; without it their
 * feats survive, so re-claiming the same product later reattaches their
 * records (feats are keyed user+product — nothing duplicates).
 */
export async function unassignPassport(
  id: string,
  purgeFeats: boolean,
): Promise<PassportResult<null>> {
  const c = client()
  if (!c.ok) return c
  const { data, error } = await c.data.rpc('admin_unassign_passport', {
    p_id: id,
    p_purge_feats: purgeFeats,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string } | null
  if (!result?.ok) return { ok: false, error: result?.error ?? 'unassign_failed' }
  return { ok: true, data: null }
}

export async function deletePassport(id: string): Promise<PassportResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data.from('product_passports').delete().eq('id', id)
  if (res.error) return { ok: false, error: res.error.message }
  return { ok: true, data: null }
}

export async function deleteBatch(batchId: string): Promise<PassportResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data.from('product_passports').delete().eq('batch_id', batchId)
  if (res.error) return { ok: false, error: res.error.message }
  return { ok: true, data: null }
}
