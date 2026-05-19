import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'

export const CMS_MEDIA_BUCKET = 'cms-media'

export type CmsDropVisualAssetRole =
  | 'emblem'
  | 'wordmark'
  | 'logo'
  | 'hero'
  | 'loading-emblem'
  | 'og-image'
  | 'media'

function sanitizeSlugPart(value: string): string {
  const t = value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-')
  return t.replace(/^-|-$/g, '') || 'drop'
}

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName
  if (file.type === 'image/svg+xml') return 'svg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/webm') return 'webm'
  return 'bin'
}

/** Public object path: `drops/{slug}/{role}-{epoch}.{ext}` */
export function formatCmsDropMediaObjectPath(
  dropSlug: string,
  role: CmsDropVisualAssetRole,
  file: File,
): string {
  const slug = sanitizeSlugPart(dropSlug)
  const ext = extensionFor(file)
  return `drops/${slug}/${role}-${Date.now()}.${ext}`
}

export function publicCmsMediaUrl(objectPath: string): string | null {
  const env = getSupabasePublicEnv()
  if (!env) return null
  const base = env.url.replace(/\/$/, '')
  const encoded = objectPath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `${base}/storage/v1/object/public/${CMS_MEDIA_BUCKET}/${encoded}`
}

export type UploadCmsMediaResult =
  | { ok: true; publicUrl: string; objectPath: string }
  | { ok: false; error: string }

export async function uploadCmsMediaFile(input: {
  file: File
  dropSlug: string
  role: CmsDropVisualAssetRole
}): Promise<UploadCmsMediaResult> {
  const env = getSupabasePublicEnv()
  if (!env) {
    return { ok: false, error: 'Supabase is not configured for uploads.' }
  }

  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Sign in to upload media to Supabase.' }
  }

  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) {
    return { ok: false, error: 'Sign in to upload media to Supabase.' }
  }

  const objectPath = formatCmsDropMediaObjectPath(
    input.dropSlug,
    input.role,
    input.file,
  )

  const { error } = await client.storage
    .from(CMS_MEDIA_BUCKET)
    .upload(objectPath, input.file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: input.file.type || undefined,
    })

  if (error) return { ok: false, error: error.message }

  const publicUrl = publicCmsMediaUrl(objectPath)
  if (!publicUrl) {
    return { ok: false, error: 'Could not resolve public media URL.' }
  }

  return { ok: true, publicUrl, objectPath }
}
