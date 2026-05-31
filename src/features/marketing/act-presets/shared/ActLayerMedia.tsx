import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import {
  type ActMediaLayer,
  resolveActLayerMedia,
} from './actLayerMedia'

export type ActLayerMediaProps = {
  row?: LandingAct
  /** background = row.media; foreground = content foregroundImageUrl/foregroundVideoUrl */
  layer?: ActMediaLayer
  className?: string
  mediaClassName?: string
  overlayClassName?: string
}

/** Renders a hero media layer (background or foreground) from CMS sources. */
export function ActLayerMedia({
  row,
  layer = 'background',
  className = 'relative overflow-hidden',
  mediaClassName = 'h-full w-full object-cover',
  overlayClassName,
}: ActLayerMediaProps) {
  const { imageUrl, videoUrl, alt } = resolveActLayerMedia(row, layer)
  const hasVideo = Boolean(videoUrl)
  const hasImage = Boolean(imageUrl)

  if (!hasVideo && !hasImage) return null

  return (
    <div className={className}>
      {hasVideo ? (
        <video
          className={mediaClassName}
          src={videoUrl}
          muted
          playsInline
          loop
          autoPlay
          aria-hidden
        />
      ) : (
        <img
          className={mediaClassName}
          src={imageUrl}
          alt={alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      )}
      {overlayClassName ? <div className={overlayClassName} aria-hidden /> : null}
    </div>
  )
}
