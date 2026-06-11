import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { cn } from '@/shared/lib/cn'
import type { StoryAsset } from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'

interface StoryMediaProps {
  asset: StoryAsset | null | undefined
  className?: string
  /** Render eagerly (above-the-fold cover). Defaults to lazy. */
  priority?: boolean
}

/**
 * Renders a resolved story asset — image, `<video>`, or sanitized external
 * embed. Returns `null` for empty/unsafe assets so callers can lay out a
 * graceful fallback. Every `src` has already passed the URL allowlists in
 * {@link resolveStoryAsset}.
 */
export function StoryMedia({ asset, className, priority = false }: StoryMediaProps) {
  const reducedMotion = useReducedMotion()
  const media = resolveStoryAsset(asset)

  if (media.type === 'none') return null

  if (media.type === 'image') {
    return (
      <img
        src={media.src}
        alt={media.alt}
        width={media.width ?? undefined}
        height={media.height ?? undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('h-full w-full object-cover', className)}
      />
    )
  }

  if (media.type === 'video') {
    return (
      <video
        src={media.src}
        poster={media.poster ?? undefined}
        className={cn('h-full w-full object-cover', className)}
        muted
        loop
        playsInline
        autoPlay={!reducedMotion}
        controls={reducedMotion}
        preload="metadata"
        aria-label={media.alt || undefined}
      />
    )
  }

  return (
    <iframe
      src={media.src}
      title={media.alt || 'Story video'}
      className={cn('h-full w-full border-0', className)}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}
