import type { StoryAsset } from '@/features/story/schemas/story.schema'
import { isLikelySafeMediaSrc, sanitizeHref } from '@/shared/lib/url'
import { publicStoryMediaUrl } from '@/features/story/lib/storyMediaUrl'

/**
 * Render-ready media resolved from a {@link StoryAsset}. Every variant has
 * already passed the relevant URL allowlist, so callers can drop `src`
 * straight into the DOM.
 */
export type ResolvedStoryMedia =
  | {
      type: 'image'
      src: string
      alt: string
      width: number | null
      height: number | null
    }
  | { type: 'video'; src: string; poster: string | null; alt: string }
  | { type: 'embed'; src: string; alt: string }
  | { type: 'none' }

function directSrc(asset: StoryAsset): string | null {
  if (asset.storagePath) return publicStoryMediaUrl(asset.storagePath)
  if (asset.url) return asset.url
  return null
}

/**
 * Turn a stored asset into safe, render-ready media. Returns `{ type: 'none' }`
 * for empty assets or anything that fails the media/href allowlists.
 */
export function resolveStoryAsset(
  asset: StoryAsset | null | undefined,
): ResolvedStoryMedia {
  if (!asset || asset.kind === 'none') return { type: 'none' }

  if (asset.kind === 'embed') {
    const src = sanitizeHref(asset.url, {
      allowRelative: false,
      schemes: ['https'],
    })
    if (!src) return { type: 'none' }
    return { type: 'embed', src, alt: asset.alt }
  }

  const src = directSrc(asset)
  if (!src || !isLikelySafeMediaSrc(src)) return { type: 'none' }

  if (asset.kind === 'video') {
    const poster =
      asset.poster && isLikelySafeMediaSrc(asset.poster) ? asset.poster : null
    return { type: 'video', src, poster, alt: asset.alt }
  }

  return {
    type: 'image',
    src,
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
  }
}
