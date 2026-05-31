import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { type ActMediaLayer, resolveActLayerMedia } from './actLayerMedia'
import { resolveActRowImage, resolveActRowMediaAlt, resolveActRowVideo } from './actPresetUtils'

type ActVisualFrameProps = {
  row?: LandingAct
  /** background = row.media; foreground = content foreground keys */
  layer?: ActMediaLayer
  contentImageKey?: string
  fallbackSrc?: string
  className?: string
  mediaClassName?: string
  overlayClassName?: string
}

/** Hero band visual — layer media, content image key, or fallback emblem. */
export function ActVisualFrame({
  row,
  layer = 'background',
  contentImageKey,
  fallbackSrc,
  className = 'relative overflow-hidden',
  mediaClassName = 'h-full w-full object-cover',
  overlayClassName = 'absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/40 to-transparent',
}: ActVisualFrameProps) {
  const layerMedia = resolveActLayerMedia(row, layer)
  const video =
    layer === 'foreground'
      ? layerMedia.videoUrl
      : resolveActRowVideo(row)
  const image =
    layer === 'foreground'
      ? layerMedia.imageUrl
      : resolveActRowImage(row, contentImageKey) ?? fallbackSrc
  const alt = resolveActRowMediaAlt(row)

  if (!video && !image) return null

  return (
    <div className={className}>
      {video ? (
        <video
          className={mediaClassName}
          src={video}
          muted
          playsInline
          loop
          autoPlay
          aria-hidden
        />
      ) : (
        <img
          className={mediaClassName}
          src={image}
          alt={alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      )}
      {overlayClassName ? <div className={overlayClassName} aria-hidden /> : null}
    </div>
  )
}
