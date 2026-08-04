import { z } from 'zod'
import { coerceUploadFile } from '@/features/admin/media/mediaMime'
import { uploadLibraryMediaFile } from '@/features/admin/media/mediaAssets.service'
import { stripFilename } from '@/features/techpacks/parse/strip'
import type { TechpackImageRole } from '@/features/techpacks/schema/techpack.zod'
import {
  TECHPACKS_BUCKET,
  client,
  friendlyError,
  requireLiveSession,
  type TechpackResult,
} from './techpacks.service'

/**
 * Storage for the private `techpacks` bucket, plus the one-way gate out of it.
 *
 * The bucket is PRIVATE and, unlike `story-media`, its SELECT is gated too —
 * so every admin preview goes through `createSignedUrl`. Techpack pixels reach
 * the storefront by exactly one route: {@link promoteTechpackImage}, which
 * re-uploads a chosen image into the PUBLIC `cms-media` library. That
 * promotion is the disclosure decision, and it is per-image on purpose —
 * print artwork especially is reproducible IP that should stay behind the gate.
 */

/** Object-path prefixes inside the bucket. */
const SOURCE_PREFIX = 'source'
const IMAGE_PREFIX = 'images'

const techpackImageRowSchema = z
  .object({
    id: z.string(),
    techpack_id: z.string(),
    ref_id: z.string(),
    page: z.coerce.number().int().catch(0),
    role: z.string().catch('unknown'),
    storage_path: z.string(),
    mime: z.string().catch('image/webp'),
    width: z.coerce.number().int().nullable().catch(null),
    height: z.coerce.number().int().nullable().catch(null),
    byte_size: z.coerce.number().catch(0),
    promoted_media_id: z.string().nullable().catch(null),
    promoted_at: z.string().nullable().catch(null),
    created_at: z.string(),
  })
  .transform((r) => ({
    id: r.id,
    techpackId: r.techpack_id,
    refId: r.ref_id,
    page: r.page,
    role: r.role,
    storagePath: r.storage_path,
    mime: r.mime,
    width: r.width,
    height: r.height,
    byteSize: r.byte_size,
    promotedMediaId: r.promoted_media_id,
    promotedAt: r.promoted_at,
    createdAt: r.created_at,
  }))

export type TechpackImageRow = z.infer<typeof techpackImageRowSchema>

const TECHPACK_IMAGE_SELECT =
  'id, techpack_id, ref_id, page, role, storage_path, mime, width, height, ' +
  'byte_size, promoted_media_id, promoted_at, created_at'

/**
 * `source/{clean-stem}-{epoch}.pdf`.
 *
 * The stem goes through `stripFilename` first: object paths surface in signed
 * URLs, so a supplier name left in the filename would outlive every other
 * stripping gate. The epoch suffix keeps re-uploads of the same pack distinct.
 */
export function formatTechpackSourcePath(filename: string): string {
  const cleaned = stripFilename(filename)
  const stem = cleaned.replace(/\.[^.]+$/, '') || 'techpack'
  return `${SOURCE_PREFIX}/${stem}-${Date.now()}.pdf`
}

/**
 * Force the body's OWN type to `application/pdf`.
 *
 * supabase-js uploads a File/Blob as multipart and IGNORES the `contentType`
 * option in that branch — the part's type comes from the Blob itself. Windows
 * browsers hand back `''` or `application/octet-stream` for a `.pdf` picked
 * from some folders, and the bucket's allowed-mime check then rejects it (the
 * 415 that bit the GLB upload path).
 */
function asPdfFile(file: File): File {
  if (file.type === 'application/pdf') return file
  return new File([file], file.name, {
    type: 'application/pdf',
    lastModified: file.lastModified,
  })
}

export interface UploadedTechpackPdf {
  path: string
  byteSize: number
  filename: string
  /**
   * Set when the PDF itself could not be stored but the pack is still usable.
   *
   * Storage rejected it as too large — the project-wide upload limit (Storage
   * settings) caps every bucket regardless of the bucket's own limit, so a
   * 100 MB bucket on a 50 MB project still refuses a 60 MB pack.
   */
  sourceSkipped: string
}

/** Storage's own "too large" rejection, which the bucket limit does not predict. */
function isTooLargeError(message: string | undefined): boolean {
  return /exceeded the maximum allowed size|payload too large|entity too large/i.test(
    message ?? '',
  )
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Put the PDF in the private bucket. Done BEFORE parsing — see techpackIngest. */
export async function uploadTechpackPdf(
  file: File,
): Promise<TechpackResult<UploadedTechpackPdf>> {
  const c = client()
  if (!c.ok) return c
  const sessionError = await requireLiveSession(c.data)
  if (sessionError) return { ok: false, error: sessionError }

  const name = file.name.toLowerCase()
  const looksPdf = file.type === 'application/pdf' || name.endsWith('.pdf')
  if (!looksPdf) return { ok: false, error: 'Techpacks must be PDF files.' }

  const objectPath = formatTechpackSourcePath(file.name)
  const { body, contentType } = coerceUploadFile(asPdfFile(file))

  const { error } = await c.data.storage
    .from(TECHPACKS_BUCKET)
    .upload(objectPath, body, { cacheControl: '3600', upsert: false, contentType })

  if (error) {
    // Too large is NOT fatal. The stored PDF only buys the ability to re-parse
    // later; every fact the feature publishes is extracted here in the browser
    // from the file the operator already has. Failing the whole ingest over it
    // would block the feature on a project setting, so this degrades instead
    // and says exactly what was lost.
    if (isTooLargeError(error.message)) {
      return {
        ok: true,
        data: {
          path: '',
          byteSize: file.size,
          filename: stripFilename(file.name),
          sourceSkipped: `Storage refused this ${formatMb(file.size)} file, so the PDF itself was not kept — raise the project's storage upload limit to store it. The techpack was still parsed in full.`,
        },
      }
    }
    return { ok: false, error: friendlyError(error.message, 'Could not upload the techpack.') }
  }

  return {
    ok: true,
    data: {
      path: objectPath,
      byteSize: file.size,
      filename: stripFilename(file.name),
      sourceSkipped: '',
    },
  }
}

export interface UploadTechpackImageMeta {
  page: number
  role?: TechpackImageRole
  width: number | null
  height: number | null
  mime?: string
}

/**
 * Store one extracted image and catalogue it.
 *
 * If the row insert fails the object is removed again — an orphan in a private
 * bucket has no row pointing at it, so nothing would ever clean it up.
 */
export async function uploadTechpackImage(
  techpackId: string,
  refId: string,
  blob: Blob,
  meta: UploadTechpackImageMeta,
): Promise<TechpackResult<TechpackImageRow>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data
  // Checked per image, not once per ingest: a 74-page pack can take minutes,
  // and the admin client never refreshes its own token. Without this the
  // uploads would start silently failing RLS halfway through a parse.
  const sessionError = await requireLiveSession(supabase)
  if (sessionError) return { ok: false, error: sessionError }

  const mime = meta.mime ?? blob.type ?? 'image/webp'
  const objectPath = `${IMAGE_PREFIX}/${techpackId}/${refId}.webp`
  const { body, contentType } = coerceUploadFile(
    new File([blob], `${refId}.webp`, { type: mime }),
  )

  const uploadRes = await supabase.storage
    .from(TECHPACKS_BUCKET)
    .upload(objectPath, body, { cacheControl: '3600', upsert: true, contentType })
  if (uploadRes.error) {
    return { ok: false, error: friendlyError(uploadRes.error.message, 'Could not store an extracted image.') }
  }

  const insertRes = await supabase
    .from('techpack_images')
    .insert({
      techpack_id: techpackId,
      ref_id: refId,
      page: meta.page,
      role: meta.role ?? 'unknown',
      storage_path: objectPath,
      mime: contentType,
      width: meta.width,
      height: meta.height,
      byte_size: blob.size,
    })
    .select(TECHPACK_IMAGE_SELECT)
    .single()

  if (insertRes.error) {
    await supabase.storage.from(TECHPACKS_BUCKET).remove([objectPath])
    return { ok: false, error: friendlyError(insertRes.error.message, 'Could not catalogue an extracted image.') }
  }

  const parsed = techpackImageRowSchema.safeParse(insertRes.data)
  if (!parsed.success) {
    await supabase.storage.from(TECHPACKS_BUCKET).remove([objectPath])
    return { ok: false, error: 'Could not read the saved image record.' }
  }
  return { ok: true, data: parsed.data }
}

export async function listTechpackImages(
  techpackId: string,
): Promise<TechpackResult<TechpackImageRow[]>> {
  const c = client()
  if (!c.ok) return c
  const res = await c.data
    .from('techpack_images')
    .select(TECHPACK_IMAGE_SELECT)
    .eq('techpack_id', techpackId)
    .order('page', { ascending: true })
    .order('ref_id', { ascending: true })
  if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not load the extracted images.') }

  const out: TechpackImageRow[] = []
  for (const row of res.data ?? []) {
    const parsed = techpackImageRowSchema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return { ok: true, data: out }
}

/**
 * Tag stored images with the role the parser eventually gave them.
 *
 * Images are uploaded page by page, BEFORE the document exists, so every row
 * starts as `unknown`. One update per distinct role (at most seven) rather
 * than one per image.
 */
export async function applyTechpackImageRoles(
  techpackId: string,
  refs: ReadonlyArray<{ id: string; role: TechpackImageRole }>,
): Promise<TechpackResult<null>> {
  const c = client()
  if (!c.ok) return c
  const byRole = new Map<TechpackImageRole, string[]>()
  for (const ref of refs) {
    if (!ref.id || ref.role === 'unknown') continue
    const list = byRole.get(ref.role) ?? []
    list.push(ref.id)
    byRole.set(ref.role, list)
  }
  for (const [role, ids] of byRole) {
    const res = await c.data
      .from('techpack_images')
      .update({ role })
      .eq('techpack_id', techpackId)
      .in('ref_id', ids)
    if (res.error) return { ok: false, error: friendlyError(res.error.message, 'Could not tag the extracted images.') }
  }
  return { ok: true, data: null }
}

/** The bucket is private — this is the only way to render an object. */
export async function signedTechpackUrl(
  path: string,
  expiresIn = 3600,
): Promise<TechpackResult<string>> {
  const c = client()
  if (!c.ok) return c
  const { data, error } = await c.data.storage
    .from(TECHPACKS_BUCKET)
    .createSignedUrl(path, expiresIn)
  if (error || !data?.signedUrl) {
    return { ok: false, error: friendlyError(error?.message, 'Could not open that file.') }
  }
  return { ok: true, data: data.signedUrl }
}

/** Batched form — one round trip for a whole image grid. */
export async function signedTechpackUrls(
  paths: readonly string[],
  expiresIn = 3600,
): Promise<TechpackResult<Record<string, string>>> {
  if (paths.length === 0) return { ok: true, data: {} }
  const c = client()
  if (!c.ok) return c
  const { data, error } = await c.data.storage
    .from(TECHPACKS_BUCKET)
    .createSignedUrls([...paths], expiresIn)
  if (error) return { ok: false, error: friendlyError(error.message, 'Could not open those files.') }

  const out: Record<string, string> = {}
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) out[entry.path] = entry.signedUrl
  }
  return { ok: true, data: out }
}

/**
 * THE DISCLOSURE GATE. Copy one extracted image out of the private bucket and
 * into the public `cms-media` library, then record the link on the techpack
 * image row so the provenance survives.
 *
 * Re-uses `uploadLibraryMediaFile` rather than writing `cms_media_assets`
 * directly, so a promoted image is indistinguishable from any other library
 * asset — the assets page, slot pickers and media index all just work.
 */
export async function promoteTechpackImage(
  image: TechpackImageRow,
  options?: { filename?: string },
): Promise<TechpackResult<{ mediaId: string; publicUrl: string }>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data
  const sessionError = await requireLiveSession(supabase)
  if (sessionError) return { ok: false, error: sessionError }

  if (image.promotedMediaId) {
    return { ok: false, error: 'That image is already in the media library.' }
  }

  const download = await supabase.storage.from(TECHPACKS_BUCKET).download(image.storagePath)
  if (download.error || !download.data) {
    return { ok: false, error: friendlyError(download.error?.message, 'Could not read that image.') }
  }

  const filename = options?.filename?.trim() || `techpack-${image.refId}.webp`
  const uploaded = await uploadLibraryMediaFile(
    new File([download.data], filename, { type: image.mime || 'image/webp' }),
  )
  if (!uploaded.ok) return { ok: false, error: uploaded.error }

  // The asset now exists publicly. If the back-link fails, say so rather than
  // deleting a live library asset out from under whoever might already use it.
  const linkRes = await supabase
    .from('techpack_images')
    .update({ promoted_media_id: uploaded.asset.id, promoted_at: new Date().toISOString() })
    .eq('id', image.id)
  if (linkRes.error) {
    return {
      ok: false,
      error: `Image published to the media library, but the techpack link failed: ${linkRes.error.message}`,
    }
  }

  return { ok: true, data: { mediaId: uploaded.asset.id, publicUrl: uploaded.publicUrl } }
}

/**
 * Remove one extracted image: the object first, then its catalogue row.
 *
 * Storage before the row, for the same reason `deleteTechpack` does it — once
 * the row is gone nothing points at the object in the private bucket, and it
 * is unreachable rather than merely unused.
 *
 * A PROMOTED image is refused. Its copy in `cms-media` is a separate, public
 * asset that a passport or PDP may already reference; deleting the techpack
 * side would silently sever the provenance link (`promoted_media_id`) while
 * leaving the live asset in place. Unpublish it from the media library first.
 */
export async function deleteTechpackImage(
  image: TechpackImageRow,
): Promise<TechpackResult<null>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data
  const sessionError = await requireLiveSession(supabase)
  if (sessionError) return { ok: false, error: sessionError }

  if (image.promotedMediaId) {
    return {
      ok: false,
      error:
        'That image is in the media library. Remove it there first — something may already be using it.',
    }
  }

  let orphaned = false
  if (image.storagePath) {
    const { error: storageErr } = await supabase.storage
      .from(TECHPACKS_BUCKET)
      .remove([image.storagePath])
    // Not fatal: an orphaned object is recoverable, a row that will not die is
    // not. Reported so the operator knows the bucket still holds it.
    if (storageErr) orphaned = true
  }

  // `.select()` is what makes this honest — a DELETE filtered out by RLS
  // affects zero rows and returns no error at all.
  const res = await supabase.from('techpack_images').delete().eq('id', image.id).select('id')
  if (res.error) {
    return { ok: false, error: friendlyError(res.error.message, 'Could not delete the image.') }
  }
  if ((res.data ?? []).length === 0) {
    return {
      ok: false,
      error: 'That image was not deleted — it may already be gone, or your account may not have permission.',
    }
  }

  if (orphaned) {
    return {
      ok: false,
      error: 'Image removed from the techpack, but its file could not be deleted and is now orphaned in the bucket.',
    }
  }
  return { ok: true, data: null }
}
