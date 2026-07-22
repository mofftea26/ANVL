import type { CSSProperties, ReactNode } from 'react'
import type {
  BannerAnimation,
  BannerConfig,
} from '@/features/cms/banner/bannerConfig.zod'

/**
 * Presentational announcement-banner strip — the ONE component rendering the
 * banner's visuals, shared verbatim by the storefront rail
 * (`SiteBannerRail`) and the admin customize modal's mini live preview so
 * they can never drift apart.
 *
 * Receives fully RESOLVED content (trimmed message, sanitized href, resolved
 * image URL) — visibility, scheduling, measuring, and sanitizing stay with
 * the callers.
 *
 * Idle animations are pure CSS (SSR-safe, no effects): unique `anvl-banner-*`
 * keyframes injected via an inline `<style>` and disabled wholesale under
 * `prefers-reduced-motion: reduce` via the media query in the CSS itself.
 * Only `transform`, `opacity`, `filter`, and `background-position` animate.
 */

export interface BannerStripProps {
  /** Trimmed message text ('' = image-only banner). */
  message: string
  /** Already-sanitized href or null. */
  href: string | null
  /** Trimmed CTA label — with an href, renders a separate link after the message. */
  linkLabel: string
  /** Resolved image URL or null. */
  imageUrl: string | null
  colors: BannerConfig['colors']
  animation: BannerAnimation
  /** Tighter paddings for the admin modal's mini preview. */
  compact?: boolean
}

/** Seamless ticker loop duration — slow enough to read comfortably. */
const MARQUEE_DURATION_S = 18
/** Sheen sweep cadence (sweep itself occupies ~a third of the cycle). */
const SHIMMER_DURATION_S = 6
/** Soft brightness breathing cadence. */
const PULSE_DURATION_S = 4
/** Gradient pan cadence. */
const GRADIENT_SHIFT_DURATION_S = 12

/**
 * All banner idle animations, gated as a block behind
 * `prefers-reduced-motion: no-preference` — reduced-motion users get the
 * static strip with zero JS involved.
 */
const BANNER_ANIMATION_CSS = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes anvl-banner-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .anvl-banner-marquee-track {
    animation: anvl-banner-marquee ${MARQUEE_DURATION_S}s linear infinite;
  }
  [data-anvl-banner-strip]:hover .anvl-banner-marquee-track {
    animation-play-state: paused;
  }
  @keyframes anvl-banner-shimmer {
    0% { transform: translateX(-100%); }
    35% { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }
  .anvl-banner-anim-shimmer::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.22) 50%, transparent 65%);
    animation: anvl-banner-shimmer ${SHIMMER_DURATION_S}s ease-in-out infinite;
  }
  @keyframes anvl-banner-pulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.14); }
  }
  .anvl-banner-anim-pulse {
    animation: anvl-banner-pulse ${PULSE_DURATION_S}s ease-in-out infinite;
  }
  @keyframes anvl-banner-gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .anvl-banner-anim-gradient-shift {
    background-size: 220% 100%;
    animation: anvl-banner-gradient-shift ${GRADIENT_SHIFT_DURATION_S}s ease-in-out infinite;
  }
}
`

/** Background CSS for the strip — solid theme fallback unless a gradient is fully specified. */
export function bannerBackgroundStyle(
  colors: BannerConfig['colors'],
): CSSProperties {
  const background = colors.background.trim()
  const background2 = colors.background2.trim()
  // Gradient needs BOTH stops — a lone background2 degrades to the solid
  // fallback path (documented in bannerConfig.zod.ts). `backgroundImage`
  // (not the `background` shorthand) so the gradient-shift class's
  // `background-size` is free to oversize it for the pan.
  if (background && background2) {
    return {
      backgroundImage: `linear-gradient(${colors.gradientAngle}deg, ${background}, ${background2})`,
    }
  }
  return { backgroundColor: background || 'var(--color-accent)' }
}

/** Whether the config can actually animate a gradient pan. */
function hasGradient(colors: BannerConfig['colors']): boolean {
  return Boolean(colors.background.trim() && colors.background2.trim())
}

export function BannerStrip({
  message,
  href,
  linkLabel,
  imageUrl,
  colors,
  animation,
  compact = false,
}: BannerStripProps) {
  // gradient-shift without a real gradient falls back to a static strip.
  const effectiveAnimation: BannerAnimation =
    animation === 'gradient-shift' && !hasGradient(colors) ? 'none' : animation

  const stripStyle: CSSProperties = {
    ...bannerBackgroundStyle(colors),
    color: colors.text.trim() || 'var(--color-on-highlight)',
  }

  const image = imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      className="h-5 w-auto shrink-0 object-contain"
      loading="lazy"
      decoding="async"
      aria-hidden="true"
    />
  ) : null

  /**
   * One copy of the banner content. The marquee renders it twice for a
   * seamless loop — the twin is `aria-hidden` with unfocusable links so
   * assistive tech and the tab order only ever meet the content once.
   */
  const content = (hidden: boolean): ReactNode => (
    <span
      aria-hidden={hidden ? 'true' : undefined}
      className={
        effectiveAnimation === 'marquee'
          ? 'flex shrink-0 items-center gap-x-3 pr-16'
          : 'contents'
      }
    >
      {image}
      {href && !linkLabel ? (
        <a
          href={href}
          tabIndex={hidden ? -1 : undefined}
          className="focus-ring underline-offset-4 hover:underline"
          style={{ color: 'inherit' }}
        >
          {message}
        </a>
      ) : (
        <span>{message}</span>
      )}
      {href && linkLabel ? (
        <a
          href={href}
          tabIndex={hidden ? -1 : undefined}
          className="focus-ring shrink-0 font-semibold underline underline-offset-4"
          style={{ color: 'inherit' }}
        >
          {linkLabel}
        </a>
      ) : null}
    </span>
  )

  const innerClassName = compact
    ? 'mx-auto flex min-h-8 max-w-[var(--anvl-content-max)] items-center justify-center gap-x-3 gap-y-1 px-3 py-1 text-center text-xs font-medium tracking-[0.04em]'
    : 'mx-auto flex min-h-9 max-w-[var(--anvl-content-max)] items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-center text-xs font-medium tracking-[0.04em] sm:text-sm'

  return (
    <div
      data-anvl-banner-strip
      data-anvl-banner-animation={effectiveAnimation}
      className={
        effectiveAnimation === 'shimmer'
          ? 'anvl-banner-anim-shimmer relative w-full overflow-hidden'
          : effectiveAnimation === 'pulse'
            ? 'anvl-banner-anim-pulse w-full'
            : effectiveAnimation === 'gradient-shift'
              ? 'anvl-banner-anim-gradient-shift w-full'
              : 'w-full'
      }
      style={stripStyle}
    >
      <style>{BANNER_ANIMATION_CSS}</style>
      {effectiveAnimation === 'marquee' ? (
        <div className="overflow-hidden" data-anvl-banner-marquee>
          <div className={`anvl-banner-marquee-track flex w-max items-center ${compact ? 'min-h-8 py-1' : 'min-h-9 py-1.5'} text-xs font-medium tracking-[0.04em] sm:text-sm`}>
            {content(false)}
            {content(true)}
          </div>
        </div>
      ) : (
        <div className={`${innerClassName} flex-wrap`}>{content(false)}</div>
      )}
    </div>
  )
}
