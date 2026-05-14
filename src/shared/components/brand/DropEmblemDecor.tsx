import { AnvlOathShape } from '@/shared/assets/brand'
import { cn } from '@/shared/lib/cn'

interface DropEmblemDecorProps {
  src?: string
  alt?: string
  /** Decorative watermark usage — hides from assistive tech and clears alt text on images. */
  presentationOnly?: boolean
  className?: string
}

/**
 * Prefer CMS emblem URL when provided; otherwise fall back to the Oath SVG shape.
 */
export function DropEmblemDecor({
  src,
  alt = '',
  presentationOnly = false,
  className,
}: DropEmblemDecorProps) {
  const trimmed = src?.trim() ?? ''
  if (trimmed) {
    return (
      <img
        src={trimmed}
        alt={presentationOnly ? '' : alt}
        aria-hidden={presentationOnly ? true : undefined}
        className={cn('pointer-events-none select-none object-contain', className)}
      />
    )
  }
  return (
    <AnvlOathShape
      className={className}
      aria-hidden={presentationOnly ? true : undefined}
    />
  )
}
