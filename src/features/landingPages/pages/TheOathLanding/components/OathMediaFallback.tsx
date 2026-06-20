import type { CSSProperties } from 'react'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { cn } from '@/shared/lib/cn'
import { oathDuotone } from '../theOathAssets'
import { OathCmsMark } from './OathCmsMark'

/**
 * Uniform soft fade on all four edges (a feathered rectangle), so the whole
 * media layer — duotone backdrop and the image/video together — dissolves into
 * the void instead of ending on a hard edge. Two crossed linear gradients
 * composited with `intersect` feather every side evenly.
 */
const FEATHER_LAYERS =
  'linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)'
const FEATHER_STYLE: CSSProperties = {
  maskImage: FEATHER_LAYERS,
  maskComposite: 'intersect',
  WebkitMaskImage: FEATHER_LAYERS,
  WebkitMaskComposite: 'source-in',
}

interface OathMediaFallbackProps {
  /** Image or video URL. When absent, a duotone + drop-mark placeholder renders. */
  media?: string
  poster?: string
  /** Duotone base for the placeholder / behind transparent media. */
  tone?: string
  className?: string
  mediaClassName?: string
  vignette?: boolean
  grain?: boolean
  /** Show the drop-mark placeholder when no media (default true). */
  showLogo?: boolean
  /** Omit the duotone fill so a shared backdrop bleeds through. */
  transparent?: boolean
  /** `data-*` marker for the motion target, e.g. `{ 'data-tenet-media': '1' }`. */
  mediaAttrs?: Record<string, string>
  /** Accessible alt — when set, the plane is not aria-hidden. */
  alt?: string
  /** Fit the whole asset (object-contain) instead of cropping to fill. */
  fit?: boolean
  /** Fade the media's edges into the background (no hard rectangle). */
  feather?: boolean
}

function isVideo(src: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(src)
}

/**
 * Full-bleed media plane — the DOM building block (and the no-WebGL / static
 * fallback). Renders a muted background video or image when assigned in the
 * CMS, else a premium duotone gradient with the drop mark, so missing assets
 * never break the page.
 */
export function OathMediaFallback({
  media,
  poster,
  tone,
  className,
  mediaClassName,
  vignette = true,
  grain = false,
  showLogo = true,
  transparent = false,
  mediaAttrs,
  alt = '',
  fit = false,
  feather = false,
}: OathMediaFallbackProps) {
  const hasMedia = Boolean(media)
  const mediaFitClass = feather
    ? 'max-h-full max-w-full object-contain'
    : cn('h-full w-full', fit ? 'object-contain' : 'object-cover')
  const mediaStyle = feather ? FEATHER_STYLE : undefined
  return (
    <div
      {...mediaAttrs}
      aria-hidden={alt ? undefined : true}
      className={cn(
        'absolute inset-0 overflow-hidden will-change-transform',
        className,
      )}
    >
      {!transparent ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: oathDuotone(tone), ...(feather ? FEATHER_STYLE : {}) }}
        />
      ) : null}

      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          mediaClassName,
        )}
      >
        {hasMedia && isVideo(media as string) ? (
          <video
            className={mediaFitClass}
            style={mediaStyle}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
          >
            <source src={media} />
          </video>
        ) : hasMedia ? (
          <img
            src={media}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={mediaFitClass}
            style={mediaStyle}
          />
        ) : showLogo ? (
          <div className="flex h-full w-full items-center justify-center opacity-[0.14]">
            <OathCmsMark
              slot="dropLogo"
              className="h-[26%] w-auto"
              width={96}
              height={96}
            />
          </div>
        ) : null}
      </div>

      {grain ? <GrainOverlay /> : null}
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
