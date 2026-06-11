import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

/** Public Supabase Storage bucket for story images + short video clips. */
export const STORY_MEDIA_BUCKET = 'story-media'

/** Object path inside the bucket: `chapters/{slug}/{kind}-{epoch}.{ext}`. */
export function formatStoryMediaObjectPath(
  scope: string,
  file: File,
): string {
  const safe =
    scope
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'story'
  const fromName = file.name.split('.').pop()?.toLowerCase()
  const ext =
    fromName && /^[a-z0-9]{1,8}$/.test(fromName)
      ? fromName
      : file.type === 'image/svg+xml'
        ? 'svg'
        : file.type === 'image/png'
          ? 'png'
          : file.type === 'image/jpeg'
            ? 'jpg'
            : file.type === 'image/webp'
              ? 'webp'
              : file.type === 'video/mp4'
                ? 'mp4'
                : file.type === 'video/webm'
                  ? 'webm'
                  : file.type === 'video/quicktime'
                    ? 'mov'
                    : 'bin'
  return `${safe}/${Date.now()}.${ext}`
}

/** Resolve a stored object path to its public CDN URL (null without env). */
export function publicStoryMediaUrl(objectPath: string): string | null {
  const env = getSupabasePublicEnv()
  if (!env) return null
  const base = env.url.replace(/\/$/, '')
  const encoded = objectPath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `${base}/storage/v1/object/public/${STORY_MEDIA_BUCKET}/${encoded}`
}

/** Inverse of {@link publicStoryMediaUrl} — extract the object path from a URL. */
export function parseStoryMediaObjectPathFromPublicUrl(
  publicUrl: string,
): string | null {
  const trimmed = publicUrl.trim()
  if (!trimmed) return null
  const marker = `/storage/v1/object/public/${STORY_MEDIA_BUCKET}/`
  const idx = trimmed.indexOf(marker)
  if (idx < 0) return null
  try {
    return decodeURIComponent(trimmed.slice(idx + marker.length))
  } catch {
    return null
  }
}
