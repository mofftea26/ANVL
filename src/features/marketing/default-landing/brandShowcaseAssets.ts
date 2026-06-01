/**
 * Premium hero layer assets for the brand showcase opening.
 * Drop optimized WebP/AVIF into `public/brand/showcase/` — CSS fallbacks render until files exist.
 */
/** Minimum delta (seconds) before seeking warrior hero video on scroll scrub. */
export const BRAND_HERO_WARRIOR_VIDEO_SEEK_EPS = 0.035

export const BRAND_HERO_ASSET_PATHS = {
  /** Static poster / reduced-motion fallback for the warrior layer. */
  warrior: '/brand/showcase/warrior-hero.webp',
  /** Full-viewport cinematic background — scrubs across the entire landing scroll. */
  warriorVideo: '/videos/WarriorHero1.mp4',
} as const

/** Public brand emblem paths — used by the default homepage showcase. */
export const BRAND_EMBLEM_ASSETS = {
  mark: '/brand/mark.svg',
  stacked: '/brand/stacked.svg',
  wordmark: '/brand/wordmark.svg',
  wordmarkAthletic: '/brand/wordmark-athletics.svg',
  oath: '/brand/the-oath-shape.svg',
} as const

/** Ambient background emblems — low-opacity overlays centered around the viewport axis. */
export const BRAND_AMBIENT_EMBLEMS = [
  { src: BRAND_EMBLEM_ASSETS.mark, left: '50%', top: '10%', width: 'clamp(120px, 16vw, 280px)', depth: 0.3, opacity: 0.035, rotate: -10, centerX: true },
  { src: BRAND_EMBLEM_ASSETS.wordmark, left: '82%', top: '22%', width: 'clamp(140px, 18vw, 320px)', depth: 0.45, opacity: 0.03, rotate: 8, centerX: true },
  { src: BRAND_EMBLEM_ASSETS.stacked, left: '18%', top: '52%', width: 'clamp(110px, 14vw, 260px)', depth: 0.55, opacity: 0.028, rotate: -6, centerX: true },
  { src: BRAND_EMBLEM_ASSETS.oath, left: '50%', top: '78%', width: 'clamp(130px, 17vw, 300px)', depth: 0.4, opacity: 0.04, rotate: 0, centerX: true },
] as const

export const BRAND_SHOWCASE_MOTION = {
  desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  snap: '(prefers-reduced-motion: reduce)',
} as const

/** Master pinned timeline — scroll progress 0→1 maps to these labeled beats. */
export const BRAND_SHOWCASE_BEATS = {
  /** Hero copy + CTAs — visible at load. */
  heroIn: 0,
  heroOut: 0.2,
  /** Manifesto heading + tenets. */
  manifestoIn: 0.22,
  manifestoOut: 0.44,
  /** Featured product cards — all visible in viewport grid. */
  productsIn: 0.46,
  /** Fully exited before closing parts — keep gap vs closingIn. */
  productsOut: 0.74,
  /** Closing shell + staged parts — holds visible through scroll end (no exit fade). */
  closingIn: 0.8,
  closingOut: 1,
} as const

/**
 * Scroll progress (0→1) for each closing beat part — sequential reveals across closingIn→closingOut.
 * Used by the master timeline and tests; percentages are of total pinned scroll.
 */
export const BRAND_SHOWCASE_CLOSING_CHOREO = {
  shellIn: BRAND_SHOWCASE_BEATS.closingIn,
  emblemStart: 0.8,
  emblemEnd: 0.844,
  eyebrowStart: 0.844,
  eyebrowEnd: 0.864,
  headlineStart: 0.864,
  headlineEnd: 0.916,
  introStart: 0.916,
  introEnd: 0.944,
  ctaShopStart: 0.944,
  ctaShopEnd: 0.972,
  ctaEnterStart: 0.972,
  ctaEnterEnd: 1,
} as const

/** Scroll distance for the single pinned master ScrollTrigger (desktop). */
export const BRAND_SHOWCASE_SCROLL_END = '+=400%'
