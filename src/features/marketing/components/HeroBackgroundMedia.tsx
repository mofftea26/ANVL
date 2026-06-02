import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'

type HeroBackgroundMediaProps = {
  videoUrl?: string
  posterUrl?: string
  playVideoOnMobile?: boolean
  className?: string
}

/**
 * Full-bleed hero backdrop — poster always; video when allowed (desktop by default).
 * Reduced-motion users see poster only via CSS.
 */
export function HeroBackgroundMedia({
  videoUrl,
  posterUrl,
  playVideoOnMobile = false,
  className,
}: HeroBackgroundMediaProps) {
  const safeVideo =
    videoUrl && isLikelySafeMediaSrc(videoUrl) ? videoUrl.trim() : ''
  const safePoster =
    posterUrl && isLikelySafeMediaSrc(posterUrl) ? posterUrl.trim() : ''

  if (!safeVideo && !safePoster) return null

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden',
        className,
      )}
    >
      {safePoster ? (
        <img
          src={safePoster}
          alt=""
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
      ) : null}
      {safeVideo ? (
        <video
          data-hero-bg-video="true"
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-center',
            !playVideoOnMobile && 'hidden md:block',
            'motion-reduce:hidden',
          )}
          src={safeVideo}
          poster={safePoster || undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[rgba(11,11,12,0.55)] via-[rgba(11,11,12,0.35)] to-[rgba(11,11,12,0.82)]"
        aria-hidden="true"
      />
    </div>
  )
}
