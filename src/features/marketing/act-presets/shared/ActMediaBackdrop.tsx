import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { readActStr } from '@/features/cms/landing/landingActPreviewOverlay'
import { resolveActLayerMedia } from './actLayerMedia'

export type ActMediaBackdropProps = {
  row?: LandingAct
  /** Optional content key fallback (e.g. backgroundImageUrl). */
  contentImageKey?: string
  className?: string
  overlayClassName?: string
}

function resolveMediaSources(
  row: LandingAct | undefined,
  contentImageKey?: string,
): { imageUrl?: string; videoUrl?: string; alt?: string } {
  const fromLayer = resolveActLayerMedia(row, 'background')
  const imageFromMedia = fromLayer.imageUrl
  const videoFromMedia = fromLayer.videoUrl
  const alt = fromLayer.alt

  const content = row?.content as Record<string, unknown> | undefined
  const imageFromContent =
    contentImageKey && content
      ? readActStr(content, contentImageKey)
      : ''

  return {
    imageUrl: imageFromMedia || imageFromContent || undefined,
    videoUrl: videoFromMedia || undefined,
    alt: alt || undefined,
  }
}

/** Full-bleed act backdrop from CMS `media` or nature content image fields. */
export function ActMediaBackdrop({
  row,
  contentImageKey,
  className = 'pointer-events-none absolute inset-0 z-0 overflow-hidden',
  overlayClassName = 'absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/40 via-[var(--color-bg)]/55 to-[var(--color-bg)]',
}: ActMediaBackdropProps) {
  const { imageUrl, videoUrl, alt } = resolveMediaSources(row, contentImageKey)
  const hasVideo = Boolean(videoUrl)
  const hasImage = Boolean(imageUrl)

  if (!hasVideo && !hasImage) return null

  return (
    <div className={className} aria-hidden>
      {hasVideo ? (
        <video
          className="h-full w-full object-cover opacity-50"
          src={videoUrl}
          muted
          playsInline
          loop
          autoPlay
          aria-hidden
        />
      ) : (
        <img
          className="h-full w-full object-cover opacity-45"
          src={imageUrl}
          alt={alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      )}
      <div className={overlayClassName} />
    </div>
  )
}
