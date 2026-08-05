/**
 * Non-blocking upload advice: "this will be slow for visitors, here is why".
 *
 * ADVISORY ONLY, deliberately. The upload is never prevented and nothing is
 * re-encoded — an operator with a good reason for a 12 MB hero still gets it.
 * The point is that today there is no signal at all: `MediaUploadZone` enforces
 * only the bucket's 50 MB hard limit, so a 9 MB PNG uploads as silently as a
 * 90 KB WebP and only shows up later as a slow page.
 *
 * WHY IT MATTERS HERE SPECIFICALLY: CMS media is served straight from Supabase
 * Storage as the raw original (`publicCmsMediaUrl` builds an `/object/public/`
 * URL). There is no resizing layer — Supabase image transformation is a Pro-plan
 * feature and this project is on the free plan — so whatever is uploaded is
 * exactly what every visitor downloads, at full resolution, forever.
 */

/** Above this, an image is worth a second look. Roughly a full-width WebP hero. */
const IMAGE_WARN_BYTES = 600_000
/** Above this it is a problem regardless of intent. */
const IMAGE_LOUD_BYTES = 2_000_000
const VIDEO_WARN_BYTES = 5_000_000
const MODEL_WARN_BYTES = 2_500_000

export type MediaUploadAdvice = {
  level: 'info' | 'warn'
  message: string
}

function mb(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

/**
 * @returns advice to show beside the file, or `null` when nothing is worth saying.
 */
export function getMediaUploadAdvice(file: {
  name: string
  size: number
  type: string
}): MediaUploadAdvice | null {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()

  if (type.startsWith('image/')) {
    const isModern = type.includes('webp') || type.includes('avif')
    const isVector = type.includes('svg')
    if (isVector) return null

    if (file.size >= IMAGE_LOUD_BYTES) {
      return {
        level: 'warn',
        message:
          `${mb(file.size)} is very large for a web image — visitors download this exact file, ` +
          'at full size, on every uncached visit. Aim for WebP or AVIF under 600 KB, and no ' +
          'wider than about 2000px unless it is a full-bleed backdrop.',
      }
    }
    if (file.size >= IMAGE_WARN_BYTES) {
      return {
        level: 'warn',
        // Both branches name the target. "This is too big" without "and here is
        // what good looks like" just makes the operator guess.
        message: isModern
          ? `${mb(file.size)} is on the heavy side. Try a lower quality setting or smaller dimensions — under 600 KB is a good target.`
          : `${mb(file.size)} — converting to WebP or AVIF typically saves 60–80% at the same visible quality, which would bring this under the 600 KB target.`,
      }
    }
    if (!isModern && file.size > 150_000) {
      return {
        level: 'info',
        message: 'WebP or AVIF would make this noticeably smaller at the same quality.',
      }
    }
    return null
  }

  if (type.startsWith('video/')) {
    if (file.size >= VIDEO_WARN_BYTES) {
      return {
        level: 'warn',
        message:
          `${mb(file.size)} of video. Consider a shorter loop, 1080p or less, and MP4/H.264 ` +
          'around 2–4 Mbps. Long hero videos are the single heaviest thing on a page.',
      }
    }
    return null
  }

  if (name.endsWith('.glb') || name.endsWith('.gltf') || type.includes('gltf')) {
    if (file.size >= MODEL_WARN_BYTES) {
      return {
        level: 'warn',
        message:
          `${mb(file.size)} for a 3D model is usually embedded textures, not geometry. ` +
          'Downsizing the textures to 1024px and re-encoding them as JPEG typically cuts ' +
          '80% with no visible difference (see scripts/compress-glb-textures.mjs).',
      }
    }
    return null
  }

  return null
}
