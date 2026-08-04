import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import {
  TECHPACK_SCHEMA_VERSION,
  parseTechpackDocument,
  type TechpackDocument,
} from '@/features/techpacks/schema/techpack.zod'

/**
 * Admin CRUD for `public.techpacks` — the same shape as
 * `passports.service.ts`: direct table access on the admin browser client
 * under editor/admin RLS, discriminated `Result` unions, an explicit column
 * list, and a Zod row schema that drops unparseable rows rather than taking
 * the page down with them.
 *
 * Two rules are load-bearing here:
 * - `is_final` is NEVER written from the client. Clearing the old final and
 *   setting the new one is two statements, and from the client they race the
 *   `techpacks_final_per_product_key` partial unique index — a lost race
 *   leaves a product with ZERO finals. `setTechpackFinal` goes through the
 *   `set_techpack_final` SECURITY DEFINER RPC, which does both atomically.
 * - Deleting a techpack removes its storage objects FIRST (mirroring
 *   `mediaAssets.service.deleteMediaAsset`). The row cascade would otherwise
 *   orphan every object in the private bucket with no row left pointing at it.
 */

export type TechpackResult<T> = { ok: true; data: T } | { ok: false; error: string }

/** PRIVATE bucket — every read goes through a signed URL. */
export const TECHPACKS_BUCKET = 'techpacks'

export const TECHPACK_STATUSES = [
  'draft',
  'parsed',
  'reviewed',
  'imported',
  'failed',
] as const
export type TechpackStatus = (typeof TECHPACK_STATUSES)[number]

const TECHPACK_AI_STATUSES = ['none', 'pending', 'ready', 'failed'] as const

/**
 * Explicit columns, never `select('*')`. `document` is a multi-hundred-KB
 * jsonb blob, so the list query deliberately omits it — pulling thirty parsed
 * packs' documents to render a list of titles is megabytes for nothing.
 */
const TECHPACK_SUMMARY_SELECT =
  'id, product_slug, title, status, is_final, schema_version, parser_version, ' +
  'source_filename, source_path, source_byte_size, page_count, ai_status, ' +
  'ai_error, issue_count, notes, created_at, updated_at, created_by'

/** Summary columns + the parsed document — one row at a time only. */
export const TECHPACK_SELECT = `${TECHPACK_SUMMARY_SELECT}, document`

const techpackRowShape = {
  id: z.string(),
  product_slug: z.string().catch(''),
  title: z.string().catch(''),
  status: z.enum(TECHPACK_STATUSES).catch('draft'),
  is_final: z.boolean().catch(false),
  schema_version: z.coerce.number().int().catch(TECHPACK_SCHEMA_VERSION),
  parser_version: z.string().catch(''),
  source_filename: z.string().catch(''),
  source_path: z.string().catch(''),
  // `bigint` — PostgREST may hand it back as a string on some drivers.
  source_byte_size: z.coerce.number().catch(0),
  page_count: z.coerce.number().int().catch(0),
  ai_status: z.enum(TECHPACK_AI_STATUSES).catch('none'),
  ai_error: z.string().catch(''),
  issue_count: z.coerce.number().int().catch(0),
  notes: z.string().catch(''),
  created_at: z.string(),
  updated_at: z.string().nullable().catch(null),
  created_by: z.string().nullable().catch(null),
}

const techpackSummaryRawSchema = z.object(techpackRowShape)

function toSummary(r: z.infer<typeof techpackSummaryRawSchema>) {
  return {
    id: r.id,
    productSlug: r.product_slug,
    title: r.title,
    status: r.status,
    isFinal: r.is_final,
    schemaVersion: r.schema_version,
    parserVersion: r.parser_version,
    sourceFilename: r.source_filename,
    sourcePath: r.source_path,
    sourceByteSize: r.source_byte_size,
    pageCount: r.page_count,
    aiStatus: r.ai_status,
    aiError: r.ai_error,
    issueCount: r.issue_count,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
  }
}

export const adminTechpackSummarySchema = techpackSummaryRawSchema.transform(toSummary)
export type AdminTechpack = z.infer<typeof adminTechpackSummarySchema>

export const adminTechpackDetailSchema = z
  .object({ ...techpackRowShape, document: z.unknown() })
  .transform((r) => ({ ...toSummary(r), document: parseTechpackDocument(r.document) }))
export type AdminTechpackDetail = z.infer<typeof adminTechpackDetailSchema>

export function client(): TechpackResult<SupabaseClient> {
  const c = getAdminSupabaseBrowserClient()
  if (!c) return { ok: false, error: 'Sign in to manage techpacks.' }
  return { ok: true, data: c }
}

/**
 * Writes need a LIVE access token: the admin browser client never
 * auto-refreshes (the server owns rotation), so after a long idle its token
 * expires and RLS-scoped writes silently no-op while RPCs reject. Fail loud
 * with a recovery hint instead.
 */
export async function requireLiveSession(c: SupabaseClient): Promise<string | null> {
  const { data } = await c.auth.getSession()
  const session = data.session
  if (!session) return 'Admin session missing — reload the admin page and try again.'
  const expiresAt = (session.expires_at ?? 0) * 1000
  if (expiresAt && expiresAt < Date.now() + 10_000) {
    return 'Admin session expired — reload the admin page and try again.'
  }
  return null
}

/** Turn Postgres/RLS noise into something an operator can act on. */
export function friendlyError(message: string | undefined, fallback: string): string {
  const raw = message ?? ''
  if (!raw) return fallback
  if (/row-level security|permission denied/i.test(raw)) {
    return 'Your account is not allowed to change techpacks (editor or admin required).'
  }
  if (/techpacks_final_per_product_key/i.test(raw)) {
    return 'That product already has a final techpack — mark this one final instead.'
  }
  if (/duplicate key/i.test(raw)) return 'That techpack already exists.'
  if (/exceeded the maximum allowed size|payload too large|entity too large/i.test(raw)) {
    // Deliberately does NOT quote the bucket's 100 MB. Supabase caps every
    // bucket by a PROJECT-WIDE upload limit, so the binding number is usually
    // smaller and naming the bucket's limit sends people looking in the wrong
    // place — a 60 MB file was being refused with "larger than the 100 MB limit".
    return 'Supabase refused this file as too large. Raise the project-wide upload limit in Storage settings — it caps every bucket, whatever the bucket itself allows.'
  }
  if (/invalid mime|mime type/i.test(raw)) return 'That file type is not accepted here.'
  return raw
}

function parseRows(rows: unknown[]): AdminTechpack[] {
  const out: AdminTechpack[] = []
  for (const row of rows) {
    const parsed = adminTechpackSummarySchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

/** Every techpack, newest first. Optionally narrowed to one product slug. */
export async function listTechpacks(options?: {
  productSlug?: string
}): Promise<TechpackResult<AdminTechpack[]>> {
  const c = client()
  if (!c.ok) return c
  let query = c.data.from('techpacks').select(TECHPACK_SUMMARY_SELECT)
  if (options?.productSlug) query = query.eq('product_slug', options.productSlug)
  const res = await query.order('created_at', { ascending: false })
  if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not load techpacks.') }
  return { ok: true, data: parseRows(res.data ?? []) }
}

/** One techpack including its parsed `document`. */
export async function getTechpack(id: string): Promise<TechpackResult<AdminTechpackDetail>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data.from('techpacks').select(TECHPACK_SELECT).eq('id', id).maybeSingle()
  if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not load the techpack.') }
  const parsed = adminTechpackDetailSchema.safeParse(res.data)
  if (!parsed.success) return { ok: false, error: 'That techpack could not be read.' }
  return { ok: true, data: parsed.data }
}

export interface CreateTechpackInput {
  title: string
  productSlug?: string
  sourceFilename: string
  sourcePath: string
  sourceByteSize: number
}

/** Insert the `draft` row that a freshly uploaded PDF hangs off. */
export async function createTechpack(
  input: CreateTechpackInput,
): Promise<TechpackResult<AdminTechpack>> {
  const c = client()
  if (!c.ok) return c
  const sessionError = await requireLiveSession(c.data)
  if (sessionError) return { ok: false, error: sessionError }

  const { data: sessionData } = await c.data.auth.getSession()
  const res = await c.data
    .from('techpacks')
    .insert({
      title: input.title.trim().slice(0, 300),
      product_slug: input.productSlug ?? '',
      status: 'draft' satisfies TechpackStatus,
      source_filename: input.sourceFilename,
      source_path: input.sourcePath,
      source_byte_size: input.sourceByteSize,
      created_by: sessionData.session?.user.id ?? null,
    })
    .select(TECHPACK_SUMMARY_SELECT)
    .single()

  if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not create the techpack.') }
  const parsed = adminTechpackSummarySchema.safeParse(res.data)
  if (!parsed.success) return { ok: false, error: 'Could not read the saved techpack.' }
  return { ok: true, data: parsed.data }
}

export interface UpdateTechpackInput {
  title?: string
  productSlug?: string
  notes?: string
  status?: TechpackStatus
}

/**
 * Operator-editable fields only — never `is_final`, never `document`.
 *
 * `.select('id')` is what makes the success honest, for the same reason
 * `deleteTechpack` needs it. An UPDATE whose row was deleted from under the
 * operator — or filtered away by RLS — matches ZERO rows and returns NO error,
 * so this used to report `ok` for an assignment that never happened. That
 * matters far more than it did: assigning a product is now a trigger, and the
 * caller writes three live CMS blobs the moment this says yes.
 */
export async function updateTechpack(
  id: string,
  input: UpdateTechpackInput,
): Promise<TechpackResult<null>> {
  const c = client()
  if (!c.ok) return c
  const sessionError = await requireLiveSession(c.data)
  if (sessionError) return { ok: false, error: sessionError }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) patch.title = input.title.trim().slice(0, 300)
  if (input.productSlug !== undefined) patch.product_slug = input.productSlug
  if (input.notes !== undefined) patch.notes = input.notes
  if (input.status !== undefined) patch.status = input.status

  const res = await c.data.from('techpacks').update(patch).eq('id', id).select('id')
  if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not save the techpack.') }
  if ((res.data ?? []).length === 0) {
    return {
      ok: false,
      error:
        'That techpack was not saved — it may have been deleted, or your account may not have permission. Reload and try again.',
    }
  }
  return { ok: true, data: null }
}

/** Write the deterministic parse result. Called only by `techpackIngest`. */
export async function saveTechpackParse(
  id: string,
  input: {
    document: TechpackDocument
    pageCount: number
    issueCount: number
    parserVersion: string
  },
): Promise<TechpackResult<null>> {
  const c = client()
  if (!c.ok) return c
  const sessionError = await requireLiveSession(c.data)
  if (sessionError) return { ok: false, error: sessionError }
  const res = await c.data
    .from('techpacks')
    .update({
      document: input.document,
      page_count: input.pageCount,
      issue_count: input.issueCount,
      parser_version: input.parserVersion,
      schema_version: TECHPACK_SCHEMA_VERSION,
      status: 'parsed' satisfies TechpackStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not save the parse.') }
  return { ok: true, data: null }
}

/** Park a failed parse on the row so the operator sees WHY, not just nothing. */
export async function markTechpackFailed(
  id: string,
  message: string,
): Promise<TechpackResult<null>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data
    .from('techpacks')
    .update({
      status: 'failed' satisfies TechpackStatus,
      notes: message.slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not flag the failure.') }
  return { ok: true, data: null }
}

/**
 * Delete a techpack. Storage objects go FIRST: the row cascade takes
 * `techpack_images` with it, and once those rows are gone nothing points at
 * the objects any more — they would sit in the private bucket forever.
 */
export async function deleteTechpack(id: string): Promise<TechpackResult<null>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data
  const sessionError = await requireLiveSession(supabase)
  if (sessionError) return { ok: false, error: sessionError }

  const rowRes = await supabase.from('techpacks').select('source_path').eq('id', id).maybeSingle()
  if (rowRes.error) return { ok: false, error: friendlyError(rowRes.error.message, 'Could not load the techpack.') }

  const imagesRes = await supabase
    .from('techpack_images')
    .select('storage_path')
    .eq('techpack_id', id)
  if (imagesRes.error) {
    return { ok: false, error: friendlyError(imagesRes.error.message, 'Could not list the techpack files.') }
  }

  const sourcePath = (rowRes.data as { source_path?: unknown } | null)?.source_path
  const paths = [
    ...(typeof sourcePath === 'string' && sourcePath ? [sourcePath] : []),
    ...(imagesRes.data ?? [])
      .map((r) => (r as { storage_path?: unknown }).storage_path)
      .filter((p): p is string => typeof p === 'string' && p.length > 0),
  ]

  // Storage first: the row cascade takes `techpack_images` with it, and once
  // those rows are gone nothing points at the objects in the private bucket.
  let orphaned = 0
  if (paths.length > 0) {
    const { error: storageErr } = await supabase.storage.from(TECHPACKS_BUCKET).remove(paths)
    if (storageErr) {
      // Do NOT abort. Aborting here left the operator with a techpack they
      // could not delete AND files they could not reach — the worst of both.
      // An orphaned object is recoverable; a row that will not die is not.
      orphaned = paths.length
    }
  }

  // `.select()` is what makes this honest. A DELETE filtered by RLS affects
  // ZERO rows and still returns no error, so without asking which rows went we
  // reported "Techpack deleted." for a techpack that is still there.
  const res = await supabase.from('techpacks').delete().eq('id', id).select('id')
  if (res.error) {
    return { ok: false, error: friendlyError(res.error.message, 'Could not delete the techpack.') }
  }
  if ((res.data ?? []).length === 0) {
    return {
      ok: false,
      error:
        'That techpack was not deleted — it may already be gone, or your account may not have permission. Reload and try again.',
    }
  }

  if (orphaned > 0) {
    return {
      ok: false,
      error: `Techpack deleted, but ${orphaned} stored file${orphaned === 1 ? '' : 's'} could not be removed and are now orphaned in the techpacks bucket.`,
    }
  }
  return { ok: true, data: null }
}

const SET_FINAL_ERRORS: Record<string, string> = {
  not_authorized: 'Your account is not allowed to mark a techpack final.',
  not_found: 'That techpack no longer exists.',
  no_product: 'Assign a product before marking this techpack final.',
}

/**
 * Mark a techpack as the product's final pack. Always via the RPC — see the
 * module header for why writing `is_final` from the client is unsafe.
 */
export async function setTechpackFinal(id: string): Promise<TechpackResult<null>> {
  const c = client()
  if (!c.ok) return c
  const sessionError = await requireLiveSession(c.data)
  if (sessionError) return { ok: false, error: sessionError }

  const { data, error } = await c.data.rpc('set_techpack_final', { p_id: id })
  if (error) return { ok: false, error: friendlyError(error.message, 'Could not mark the techpack final.') }
  const result = data as { ok?: boolean; error?: string } | null
  if (!result?.ok) {
    const code = result?.error ?? 'set_final_failed'
    return { ok: false, error: SET_FINAL_ERRORS[code] ?? code }
  }
  return { ok: true, data: null }
}
