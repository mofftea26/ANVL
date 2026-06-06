import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface WarBannerProps {
  /** Duotone base behind the media / placeholder. */
  tone?: string
  /** Image URL. When absent, a duotone plane + emblem placeholder renders. */
  media?: string
  alt?: string
  /** Small heraldic label pinned to the crossbar (e.g. a piece role / numeral). */
  label?: ReactNode
  /** Content overlaid on the fabric body (name, price, CTA). */
  children?: ReactNode
  /** Idle hanging sway (motion-safe; auto-disabled under reduced motion). */
  sway?: boolean
  /** Emblem shown when there is no media. Defaults to the Drop 01 shape. */
  placeholderSrc?: string
  /** Aspect ratio of the fabric body. Defaults to a tall gonfalon. */
  aspectClassName?: string
  className?: string
}

/** Gonfalon silhouette — rectangle tapering to a single downward point. */
const BANNER_CLIP = 'polygon(0 0, 100% 0, 100% 84%, 50% 100%, 0 84%)'

/** Forged-metal gradient for the crossbar + finials. */
const FORGE_METAL =
  'linear-gradient(180deg, #7a7d81 0%, #45484c 38%, #26282b 70%, #161719 100%)'

function duotone(tone = '#1a1c1f'): string {
  return `linear-gradient(158deg, ${tone} 0%, #0b0b0c 82%)`
}

/**
 * A 3D medieval war banner: a forged crossbar with two hang-straps and a fabric
 * gonfalon that tapers to a point, framed in ember and grained. Wraps a media
 * plane (image) or falls back to a duotone + emblem placeholder, so it renders
 * premium before real product art exists. Used on the landing's horizontal
 * product reveal and across the warrior pages.
 *
 * Framework-agnostic and feature-free (lives in `shared/`). All motion is
 * CSS-driven and gated by `prefers-reduced-motion` (see `.anvl-banner-sway`).
 */
export function WarBanner({
  tone = '#1a1c1f',
  media,
  alt = '',
  label,
  children,
  sway = false,
  placeholderSrc = '/brand/the-oath-shape.svg',
  aspectClassName = 'aspect-[3/5]',
  className,
}: WarBannerProps) {
  return (
    <figure className={cn('relative m-0 [perspective:1400px]', className)}>
      {/* Forged crossbar + finials. */}
      <div
        aria-hidden="true"
        className="absolute -top-1 left-1/2 z-20 h-2.5 w-[112%] -translate-x-1/2 rounded-full"
        style={{ background: FORGE_METAL, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.7)' }}
      >
        <span className="absolute -left-1.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full" style={{ background: FORGE_METAL }} />
        <span className="absolute -right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full" style={{ background: FORGE_METAL }} />
      </div>

      {/* Two hang-straps from the bar to the fabric. */}
      <span aria-hidden="true" className="absolute left-[22%] top-1 z-10 h-5 w-1.5 rounded-sm bg-[var(--color-ember)]/70" />
      <span aria-hidden="true" className="absolute right-[22%] top-1 z-10 h-5 w-1.5 rounded-sm bg-[var(--color-ember)]/70" />

      {/* Fabric body. */}
      <div
        className={cn(
          'relative mt-4 overflow-hidden [transform-style:preserve-3d]',
          sway && 'anvl-banner-sway',
        )}
        style={{ clipPath: BANNER_CLIP, WebkitClipPath: BANNER_CLIP }}
      >
        <div
          className={cn('relative w-full', aspectClassName)}
          style={{
            background: duotone(tone),
            boxShadow: 'inset 0 0 0 1px var(--color-ember-soft), 0 40px 80px -50px rgba(0,0,0,0.95)',
          }}
        >
          {media ? (
            <img
              src={media}
              alt={alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={placeholderSrc}
                alt=""
                aria-hidden="true"
                className="h-[34%] w-auto opacity-[0.5]"
                style={{ filter: 'drop-shadow(0 0 18px var(--color-ember-soft))' }}
              />
            </div>
          )}

          {/* Grain. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
              backgroundSize: '3px 3px',
            }}
          />
          {/* Vertical fabric sheen + bottom shadow toward the point. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          {/* Ember frame. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[6px] border border-[var(--color-ember)]/35"
          />

          {label ? (
            <span className="anvl-display absolute left-1/2 top-4 z-10 -translate-x-1/2 text-[11px] tracking-[0.28em] text-[var(--color-ember-bright)]">
              {label}
            </span>
          ) : null}

          {children ? (
            <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[18%] pt-10">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </figure>
  )
}
