import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

/**
 * Storefront-safe: builds public CDN URLs for the `cms-media` bucket. No
 * admin/auth/mutation logic lives here — those stay in
 * `features/admin/cmsRemote/uploadCmsMedia.ts`, which re-exports this module
 * so existing admin call sites don't need to change their import path.
 */
export const CMS_MEDIA_BUCKET = 'cms-media'

export function publicCmsMediaUrl(
  objectPath: string | null | undefined,
): string | null {
  const trimmed = objectPath?.trim()
  if (!trimmed) return null
  const env = getSupabasePublicEnv()
  if (!env) return null
  const base = env.url.replace(/\/$/, '')
  const encoded = trimmed
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `${base}/storage/v1/object/public/${CMS_MEDIA_BUCKET}/${encoded}`
}
