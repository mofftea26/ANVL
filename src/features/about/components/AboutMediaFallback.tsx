import { cn } from '@/shared/lib/cn'

interface AboutMediaFallbackProps {
  /** Resolved image URL from the Assets CMS. When absent, a themed duotone
   *  gradient renders instead so a missing asset never breaks the page. */
  media?: string
  alt?: string
  className?: string
  mediaClassName?: string
  vignette?: boolean
  /** `data-*` marker for the motion target, e.g. `{ 'data-materials-layer': '1' }`. */
  layerAttrs?: Record<string, string>
}

/**
 * Full-bleed media plane — the DOM building block for every About scene
 * backdrop/close-up. Renders the CMS-assigned image when present, else a
 * premium duotone gradient from the active theme, so an unassigned slot never
 * renders blank. Mirrors `OathMediaFallback`, simplified (stills only).
 */
export function AboutMediaFallback({
  media,
  alt = '',
  className,
  mediaClassName,
  vignette = true,
  layerAttrs,
}: AboutMediaFallbackProps) {
  return (
    <div
      {...layerAttrs}
      aria-hidden={alt ? undefined : true}
      className={cn('absolute inset-0 overflow-hidden will-change-transform', className)}
    >
      {media ? (
        <img
          src={media}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn('h-full w-full object-cover', mediaClassName)}
        />
      ) : (
        <div
          aria-hidden="true"
          className={cn('h-full w-full', mediaClassName)}
          style={{
            background:
              'radial-gradient(ellipse 120% 90% at 50% 30%, var(--color-surface-elevated, #1D1F21) 0%, var(--color-bg, #0B0B0C) 70%)',
          }}
        />
      )}
      {vignette ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 92% 82% at 50% 42%, transparent 28%, rgba(0,0,0,0.58) 100%)',
          }}
        />
      ) : null}
    </div>
  )
}
