/**
 * THE ABOUT SCROLL FILM'S CHOREOGRAPHY CLOCK.
 *
 * Rule 5 of the particle-forge standard (`docs/animation-guidelines.md`): the
 * DOM motion builders and the WebGL depth canvas never call each other — both
 * schedule against these exported constants. Pin lengths are percentages of
 * the viewport (ScrollTrigger `end: '+=N%'`); chapter beats are fractions of
 * the chapter's own scrubbed timeline.
 *
 * A chapter's life: MATERIALIZE (the backdrop condenses out of the depth —
 * blur clears, scale settles — while the copy forges in staggered) → HOLD
 * (the chapter owns the frame; slow drift only) → DISSOLVE (the chapter
 * releases past the camera — scale pushes on, blur returns, copy lifts away).
 */
export const ABOUT_SCROLL = {
  /** Hero pin length — the cold open's scrub room. */
  heroPinPct: 150,
  /** Each orb chapter's pin length. */
  chapterPinPct: 140,
  /** The altar finale's settle-in pin. */
  altarPinPct: 60,

  /**
   * ScrollTrigger `scrub` for every pinned timeline — the seconds the
   * animation takes to CATCH UP to the scroll position. Higher = the film
   * eases behind the wheel like a camera operator following action instead
   * of tracking it 1:1; paired with the route's softer Lenis lerp this is
   * most of the "immersive" feel.
   */
  scrubSmoothing: 1.6,

  /** Chapter beat fractions (0..1 of the chapter timeline). Materialize is
   *  generous — the per-role reveal cascade (typewriter eyebrow → title →
   *  plates → body → points/stats → CTAs → tagline) needs the room. */
  materializeEnd: 0.36,
  holdEnd: 0.75,

  /**
   * How many chapters ahead of the finale the altar stage mounts — its GLB
   * Suspense load IS the prefetch, so by arrival the progress bar usually
   * completes in a beat.
   */
  prefetchLeadChapters: 2,

  /** The strike-answer scroll back up to a chapter (Lenis eased). */
  scrollToDurationS: 1.6,

  /** Boundary ember burst — morph + heat decay, per the particle-forge feel
   *  targets (morphs ~1.6s power2.inOut, bursts ~1.4s power2.out). */
  boundaryMorphS: 1.6,
  boundaryBurstS: 1.4,
} as const

/**
 * Scroll distance one chapter occupies, in viewport-heights: its own 100svh
 * plus the pin's extra scrub room. The altar-approach trigger converts this
 * into a `top bottom+=N%` start line.
 */
export const ABOUT_CHAPTER_SPAN_VH = 100 + ABOUT_SCROLL.chapterPinPct

/**
 * The strike-answer scroll's ease — a long cinematic settle (power3.inOut
 * shape) for Lenis' `easing` option, which takes a plain 0..1 function.
 */
export function aboutScrollToEase(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
