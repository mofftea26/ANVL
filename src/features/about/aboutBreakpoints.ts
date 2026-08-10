/**
 * The About page tier contract:
 * - desktop cinematic: `≥1280px` (`xl+`) + no reduced motion — the
 *   scrollytelling film (pinned chapters, GSAP scrub, the WebGL depth canvas
 *   behind them, the Forge Altar finale)
 * - everything else (mobile, tablet, reduced motion): the static scrolling
 *   About page (no pins, no WebGL)
 *
 * The two queries are exhaustive and mutually exclusive — every device lands
 * in exactly one branch (the same contract as `oathBreakpoints.ts`). WebGL
 * availability is deliberately NOT part of this split: a capable-width device
 * without WebGL still gets the DOM film; only the canvas gate checks
 * `isWebglAvailable()`.
 */
export const ABOUT_DESKTOP_MIN_PX = 1280

export const ABOUT_CINEMATIC_MQ =
  `(min-width: ${ABOUT_DESKTOP_MIN_PX}px) and (prefers-reduced-motion: no-preference)` as const

export const ABOUT_STATIC_MQ =
  '(max-width: 1279.98px), (prefers-reduced-motion: reduce)' as const
