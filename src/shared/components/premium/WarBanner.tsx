import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { ThemeTintedMediaMark } from '@/shared/components/ui/ThemeTintedMediaMark'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { isSvgEmblemUrl } from '@/shared/lib/themeSvgMarkup'
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
  /** Pre-themed inline SVG for the placeholder — renders tinted on first paint. */
  placeholderThemedMarkup?: string | null
  /** Aspect ratio of the fabric body. Defaults to a tall gonfalon. */
  aspectClassName?: string
  /** Stronger drop shadow + ground glow (product showcase). */
  elevated?: boolean
  /** Tilt fabric toward the pointer on hover (anchored at the crossbar). */
  interactive3d?: boolean
  /** Stagger idle sway phase (seconds). */
  swayDelay?: number
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

const TILT_RX = 13
const TILT_RY = 16
const EMBLEM_SIZE = {
  default: { className: 'h-[58%] aspect-square opacity-65', px: 144 },
  elevated: { className: 'h-[68%] aspect-square opacity-70', px: 176 },
} as const

/**
 * A 3D medieval war banner: a forged crossbar with two hang-straps and a fabric
 * gonfalon that tapers to a point, framed in ember and grained. Wraps a media
 * plane (image) or falls back to a duotone + emblem placeholder, so it renders
 * premium before real product art exists. Used on the landing's horizontal
 * product reveal and across the warrior pages.
 */
export function WarBanner({
  tone = '#1a1c1f',
  media,
  alt = '',
  label,
  children,
  sway = false,
  placeholderSrc = '/brand/the-oath-shape.svg',
  placeholderThemedMarkup = null,
  aspectClassName = 'aspect-[3/5]',
  elevated = false,
  interactive3d = true,
  swayDelay = 0,
  className,
}: WarBannerProps) {
  const rootRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false })

  const useThemedPlaceholder =
    !media &&
    (Boolean(placeholderThemedMarkup) || isSvgEmblemUrl(placeholderSrc))

  const canTilt = interactive3d && !reducedMotion

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!canTilt || !rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const nx = (event.clientX - rect.left) / rect.width - 0.5
      const ny = (event.clientY - rect.top) / rect.height - 0.5

      setTilt({
        rx: -ny * TILT_RX * 2,
        ry: nx * TILT_RY * 2,
        active: true,
      })
    },
    [canTilt],
  )

  const resetTilt = useCallback(() => {
    setTilt({ rx: 0, ry: 0, active: false })
  }, [])

  const emblem = elevated ? EMBLEM_SIZE.elevated : EMBLEM_SIZE.default

  const fabricTransform =
    canTilt && tilt.active
      ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(6px)`
      : undefined

  const strapTilt = tilt.ry * 0.35

  return (
    <figure
      ref={rootRef}
      className={cn(
        'anvl-banner-root group relative m-0 [perspective:1400px]',
        elevated && 'anvl-banner-root--elevated',
        tilt.active && 'anvl-banner-root--tilting',
        className,
      )}
      onPointerMove={canTilt ? handlePointerMove : undefined}
      onPointerEnter={canTilt ? handlePointerMove : undefined}
      onPointerLeave={canTilt ? resetTilt : undefined}
      style={sway ? ({ ['--sway-delay' as string]: `${swayDelay}s` } as CSSProperties) : undefined}
    >
      {elevated ? (
        <div
          aria-hidden="true"
          className="anvl-banner-ground-glow pointer-events-none absolute -bottom-2 left-1/2 z-0 h-12 w-[88%] -translate-x-1/2 rounded-[100%] opacity-90"
          style={{
            background:
              'radial-gradient(ellipse, color-mix(in srgb, var(--color-ember) 26%, transparent) 0%, transparent 72%)',
            filter: 'blur(10px)',
          }}
        />
      ) : null}

      {/* Forged crossbar + finials — fixed; fabric pivots below this axis. */}
      <div
        aria-hidden="true"
        className="absolute -top-1 left-1/2 z-20 h-2.5 w-[112%] -translate-x-1/2 rounded-full"
        style={{
          background: FORGE_METAL,
          boxShadow:
            '0 4px 14px -2px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.12) inset',
        }}
      >
        <span
          className="absolute -left-1.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
          style={{ background: FORGE_METAL }}
        />
        <span
          className="absolute -right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
          style={{ background: FORGE_METAL }}
        />
      </div>

      {/* Two hang-straps from the bar to the fabric. */}
      <span
        aria-hidden="true"
        className="anvl-banner-strap-left absolute left-[22%] top-1 z-10 h-5 w-1.5 origin-top rounded-sm bg-[var(--color-ember)]/70 transition-transform duration-300 ease-out"
        style={{ transform: tilt.active ? `rotate(${-strapTilt}deg)` : undefined }}
      />
      <span
        aria-hidden="true"
        className="anvl-banner-strap-right absolute right-[22%] top-1 z-10 h-5 w-1.5 origin-top rounded-sm bg-[var(--color-ember)]/70 transition-transform duration-300 ease-out"
        style={{ transform: tilt.active ? `rotate(${strapTilt}deg)` : undefined }}
      />

      {/* Fabric — pivots from the crossbar, tilts toward the pointer. */}
      <div
        className="anvl-banner-fabric relative mt-4"
        style={{
          clipPath: BANNER_CLIP,
          WebkitClipPath: BANNER_CLIP,
          transformOrigin: 'top center',
          transform: fabricTransform,
        }}
      >
        <div
          className={cn(
            'relative overflow-hidden [transform-style:preserve-3d]',
            sway && (elevated ? 'anvl-banner-sway-rich' : 'anvl-banner-sway'),
            tilt.active && 'anvl-banner-sway-paused',
          )}
        >
          <div
            className={cn('anvl-banner-body relative w-full', aspectClassName)}
            style={{ background: duotone(tone) }}
          >
            {media ? (
              <img
                src={media}
                alt={alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : useThemedPlaceholder ? (
              <div className="anvl-banner-emblem absolute inset-0 flex items-center justify-center">
                <ThemeTintedMediaMark
                  src={placeholderSrc}
                  themedSvgMarkup={placeholderThemedMarkup}
                  className={emblem.className}
                  width={emblem.px}
                  height={emblem.px}
                  tint="var(--color-heading)"
                  glow="var(--color-ember)"
                />
              </div>
            ) : (
              <div className="anvl-banner-emblem absolute inset-0 flex items-center justify-center">
                <img
                  src={placeholderSrc}
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    elevated ? 'h-[68%] w-auto opacity-70' : 'h-[58%] w-auto opacity-65',
                  )}
                  style={{ filter: 'drop-shadow(0 0 22px var(--color-ember-soft))' }}
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
            {/* Vertical fabric sheen + slow light sweep. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 32%, transparent 100%)',
              }}
            />
            <div
              aria-hidden="true"
              className="anvl-banner-sheen pointer-events-none absolute inset-0 opacity-40"
            />
            {/* Side ember rails only. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[14%] left-[6px] top-[8%] w-px bg-gradient-to-b from-[var(--color-ember)]/50 via-[var(--color-ember)]/28 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[14%] right-[6px] top-[8%] w-px bg-gradient-to-b from-[var(--color-ember)]/50 via-[var(--color-ember)]/28 to-transparent"
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
      </div>
    </figure>
  )
}
