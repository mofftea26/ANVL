import type { SupabaseClient } from '@supabase/supabase-js'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { CMS_MEDIA_BUCKET, publicCmsMediaUrl } from '@/features/cms/media/mediaUrl'
import { coerceUploadFile, extensionFor } from './mediaMime'
import type {
  CmsMediaAsset,
  MediaAssetMutationResult,
  MediaAssetsListResult,
  MediaIndexEntry,
} from './mediaAssets.types'

export { resolveUploadMimeType } from './mediaMime'

function sanitizeFilename(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
  return base.replace(/^-|-$/g, '') || 'asset'
}

/** Object path: `library/{stem}-{epoch}.{ext}` */
export function formatCmsLibraryMediaObjectPath(file: File): string {
  const ext = extensionFor(file)
  const rawName = file.name.trim().toLowerCase()
  const withoutExt = rawName.includes('.') ? rawName.replace(/\.[^.]+$/, '') : rawName
  const stem = sanitizeFilename(withoutExt || 'asset')
  return `library/${stem}-${Date.now()}.${ext}`
}

export function mapMediaAssetRow(row: Record<string, unknown>): CmsMediaAsset | null {
  const id = typeof row.id === 'string' ? row.id : ''
  const storagePath =
    typeof row.storage_path === 'string' ? row.storage_path : ''
  const filename = typeof row.filename === 'string' ? row.filename : ''
  const mime = typeof row.mime === 'string' ? row.mime : ''
  if (!id || !storagePath || !filename || !mime) return null

  const byteRaw = row.byte_size
  const byteSize =
    typeof byteRaw === 'number'
      ? byteRaw
      : typeof byteRaw === 'string'
        ? Number(byteRaw)
        : 0

  const widthRaw = row.width
  const heightRaw = row.height
  const width =
    typeof widthRaw === 'number'
      ? widthRaw
      : widthRaw == null
        ? null
        : Number(widthRaw)
  const height =
    typeof heightRaw === 'number'
      ? heightRaw
      : heightRaw == null
        ? null
        : Number(heightRaw)

  const tags = Array.isArray(row.tags)
    ? row.tags.filter((t): t is string => typeof t === 'string')
    : []

  const createdAt =
    typeof row.created_at === 'string'
      ? row.created_at
      : new Date().toISOString()

  const createdBy =
    typeof row.created_by === 'string' ? row.created_by : null

  return {
    id,
    storagePath,
    filename,
    alt: typeof row.alt === 'string' ? row.alt : '',
    mime,
    byteSize: Number.isFinite(byteSize) ? byteSize : 0,
    width: width != null && Number.isFinite(width) ? width : null,
    height: height != null && Number.isFinite(height) ? height : null,
    tags,
    createdAt,
    createdBy,
  }
}

export function buildMediaIndex(assets: CmsMediaAsset[]): MediaIndexEntry[] {
  return assets.map((a) => ({
    id: a.id,
    path: a.storagePath,
    alt: a.alt,
    mime: a.mime,
    w: a.width,
    h: a.height,
    updatedAt: a.createdAt,
  }))
}

export function filterMediaAssets(
  assets: CmsMediaAsset[],
  query: string,
  mimeFilter: string | null,
): CmsMediaAsset[] {
  const q = query.trim().toLowerCase()
  return assets.filter((a) => {
    if (mimeFilter && mimeFilter !== 'all') {
      if (mimeFilter === 'image' && !a.mime.startsWith('image/')) return false
      if (mimeFilter === 'video' && !a.mime.startsWith('video/')) return false
      if (mimeFilter !== 'image' && mimeFilter !== 'video' && a.mime !== mimeFilter) {
        return false
      }
    }
    if (!q) return true
    const hay = `${a.filename} ${a.alt} ${a.tags.join(' ')}`.toLowerCase()
    return hay.includes(q)
  })
}

export function mediaAssetPublicUrl(asset: CmsMediaAsset): string | null {
  return publicCmsMediaUrl(asset.storagePath)
}

export async function readImageDimensions(
  file: File,
): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return { width: null, height: null }
  }
  if (typeof window === 'undefined') return { width: null, height: null }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth || null,
        height: img.naturalHeight || null,
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: null, height: null })
    }
    img.src = url
  })
}

export async function listMediaAssets(
  client?: SupabaseClient | null,
): Promise<MediaAssetsListResult> {
  const supabase = client ?? getAdminSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, error: 'Sign in to load the media library.' }
  }

  const { data, error } = await supabase
    .from('cms_media_assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const assets: CmsMediaAsset[] = []
  for (const row of data ?? []) {
    const mapped = mapMediaAssetRow(row as Record<string, unknown>)
    if (mapped) assets.push(mapped)
  }
  return { ok: true, assets }
}

export async function insertMediaAssetRecord(input: {
  client?: SupabaseClient | null
  storagePath: string
  filename: string
  mime: string
  byteSize: number
  width?: number | null
  height?: number | null
  alt?: string
  tags?: string[]
}): Promise<MediaAssetMutationResult> {
  const supabase = input.client ?? getAdminSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, error: 'Sign in to save media metadata.' }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id ?? null

  const { data, error } = await supabase
    .from('cms_media_assets')
    .insert({
      storage_path: input.storagePath,
      filename: input.filename,
      mime: input.mime,
      byte_size: input.byteSize,
      width: input.width ?? null,
      height: input.height ?? null,
      alt: input.alt ?? '',
      tags: input.tags ?? [],
      created_by: userId,
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  const asset = mapMediaAssetRow((data ?? {}) as Record<string, unknown>)
  if (!asset) return { ok: false, error: 'Could not parse saved asset.' }

  return { ok: true, asset }
}

export async function updateMediaAssetAlt(
  id: string,
  alt: string,
  client?: SupabaseClient | null,
): Promise<MediaAssetMutationResult> {
  const supabase = client ?? getAdminSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, error: 'Sign in to update media.' }
  }

  const { data, error } = await supabase
    .from('cms_media_assets')
    .update({ alt: alt.trim() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  const asset = mapMediaAssetRow((data ?? {}) as Record<string, unknown>)
  if (!asset) return { ok: false, error: 'Could not parse updated asset.' }
  return { ok: true, asset }
}

export async function deleteMediaAsset(
  asset: CmsMediaAsset,
  client?: SupabaseClient | null,
): Promise<MediaAssetMutationResult> {
  const supabase = client ?? getAdminSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, error: 'Sign in to delete media.' }
  }

  const { error: storageErr } = await supabase.storage
    .from(CMS_MEDIA_BUCKET)
    .remove([asset.storagePath])

  if (storageErr) return { ok: false, error: storageErr.message }

  const { error } = await supabase
    .from('cms_media_assets')
    .delete()
    .eq('id', asset.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function uploadLibraryMediaFile(
  file: File,
): Promise<
  | { ok: true; asset: CmsMediaAsset; publicUrl: string }
  | { ok: false; error: string }
> {
  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Sign in to upload media to Supabase.' }
  }

  const objectPath = formatCmsLibraryMediaObjectPath(file)
  // Re-wrapped so the Blob itself carries the resolved mime — supabase-js
  // ignores `contentType` for File bodies (multipart path); see mediaMime.ts.
  const { body, contentType } = coerceUploadFile(file)

  const { error: uploadErr } = await client.storage
    .from(CMS_MEDIA_BUCKET)
    .upload(objectPath, body, {
      cacheControl: '31536000',
      upsert: false,
      contentType,
    })

  if (uploadErr) return { ok: false, error: uploadErr.message }

  const publicUrl = publicCmsMediaUrl(objectPath)
  if (!publicUrl) {
    return { ok: false, error: 'Could not resolve public media URL.' }
  }

  const dims = await readImageDimensions(file)
  const inserted = await insertMediaAssetRecord({
    client,
    storagePath: objectPath,
    filename: file.name,
    mime: contentType,
    byteSize: file.size,
    width: dims.width,
    height: dims.height,
  })

  if (!inserted.ok || !inserted.asset) {
    await client.storage.from(CMS_MEDIA_BUCKET).remove([objectPath])
    return { ok: false, error: inserted.ok ? 'Could not save asset.' : inserted.error }
  }

  return { ok: true, asset: inserted.asset, publicUrl }
}
