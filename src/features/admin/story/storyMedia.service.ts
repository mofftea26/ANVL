import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import {
  EMPTY_STORY_ASSET,
  type StoryAsset,
} from '@/features/story/schemas/story.schema'
import {
  STORY_MEDIA_BUCKET,
  formatStoryMediaObjectPath,
  parseStoryMediaObjectPathFromPublicUrl,
} from '@/features/story/lib/storyMediaUrl'

export type UploadStoryMediaResult =
  | { ok: true; asset: StoryAsset }
  | { ok: false; error: string }

/** Read an image's natural dimensions in the browser (best-effort). */
async function readImageDimensions(
  file: File,
): Promise<{ width: number | null; height: number | null }> {
  if (!file.type.startsWith('image/') || typeof window === 'undefined') {
    return { width: null, height: null }
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: null, height: null })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

/**
 * Upload an image or video to the public `story-media` bucket and return a
 * ready-to-store {@link StoryAsset} (kind inferred from the MIME type).
 * `scope` shapes the object path (e.g. a chapter slug).
 */
export async function uploadStoryMedia(
  file: File,
  scope: string,
  alt: string,
): Promise<UploadStoryMediaResult> {
  const client = getAdminSupabaseBrowserClient()
  if (!client) return { ok: false, error: 'Sign in to upload story media.' }

  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) {
    return { ok: false, error: 'Sign in to upload story media.' }
  }

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  if (!isImage && !isVideo) {
    return { ok: false, error: 'Only image or video files are supported.' }
  }

  const objectPath = formatStoryMediaObjectPath(scope, file)
  const { error } = await client.storage
    .from(STORY_MEDIA_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || undefined,
    })
  if (error) return { ok: false, error: error.message }

  const dims = isImage
    ? await readImageDimensions(file)
    : { width: null, height: null }

  return {
    ok: true,
    asset: {
      ...EMPTY_STORY_ASSET,
      kind: isImage ? 'image' : 'video',
      storagePath: objectPath,
      alt,
      width: dims.width,
      height: dims.height,
    },
  }
}

/** Remove a previously uploaded story media object by its public URL or path. */
export async function deleteStoryMedia(pathOrUrl: string): Promise<void> {
  const client = getAdminSupabaseBrowserClient()
  if (!client) return
  const objectPath =
    parseStoryMediaObjectPathFromPublicUrl(pathOrUrl) ?? pathOrUrl
  if (!objectPath) return
  await client.storage.from(STORY_MEDIA_BUCKET).remove([objectPath])
}
