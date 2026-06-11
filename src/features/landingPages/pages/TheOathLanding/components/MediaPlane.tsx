import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { cn } from '@/shared/lib/cn'
import { duotonePlaceholder } from '../theOathAssets'
import { OathCmsMark } from './OathCmsMark'

interface MediaPlaneProps {
  /** Image or video URL. When absent, a duotone + Drop-logo placeholder renders. */
  media?: string
  poster?: string
  /** Duotone base for the placeholder / behind transparent media. */
  tone?: string
  className?: string
  mediaClassName?: string
  vignette?: boolean
  grain?: boolean
  /** Show the Drop-logo placeholder when no media (default true). */
  showLogo?: boolean
  /** Omit the opaque duotone fill so a shared backdrop (ForgeAtmosphere) bleeds
      through — used to make adjacent scenes read as one continuous environment. */
  transparent?: boolean
  /** `data-*` marker for the parallax target, e.g. `{ 'data-hero-media': 'true' }`. */
  mediaAttrs?: Record<string, string>
  /** Accessible alt — when set, the plane is not aria-hidden. */
  alt?: string
}

function isVideo(src: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(src)
}

/**
 * Full-bleed media plane — the cinematic building block. Renders a background
 * video (muted/looping) or image when configured, else a premium duotone
 * gradient with the Drop 01 logo placeholder, so missing assets never break the
 * page. The inner moving layer carries the parallax `data-*` marker.
 *
 * TODO(perf): when real video assets land, swap to the poster `<img>` on
 * `(max-width: 767px)` to avoid shipping video to phones.
 */
export function MediaPlane({
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
}: MediaPlaneProps) {
  const hasMedia = Boolean(media)
  return (
    <div
      aria-hidden={alt ? undefined : true}
      className={cn('absolute inset-0 overflow-hidden', className)}
    >
      <div
        {...mediaAttrs}
        className={cn('absolute inset-0 will-change-transform', mediaClassName)}
        style={transparent ? undefined : { background: duotonePlaceholder(tone) }}
      >
        {hasMedia && isVideo(media as string) ? (
          <video
            className="h-full w-full object-cover"
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
            className="h-full w-full object-cover"
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
