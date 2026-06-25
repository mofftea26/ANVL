/**
 * Shared landing-page breakpoint contract (Tailwind-aligned), used by code-owned
 * cinematic pages. Mirrors The Oath's contract so every landing experience gates
 * its heavy motion/WebGL identically:
 * - mobile `<768px` + tablet `768–1279px` → static layout, no pins, no WebGL
 * - desktop cinematic `≥1280px` (`xl+`) + no reduced motion → GSAP pins + WebGL
 */
export const LANDING_DESKTOP_MIN_PX = 1280

export const LANDING_DESKTOP_CINEMATIC_MQ =
  `(min-width: ${LANDING_DESKTOP_MIN_PX}px) and (prefers-reduced-motion: no-preference)` as const

export const LANDING_STATIC_MQ =
  '(max-width: 1279.98px), (prefers-reduced-motion: reduce)' as const

export const LANDING_FINE_POINTER_DESKTOP_MQ =
  `(pointer: fine) and (min-width: ${LANDING_DESKTOP_MIN_PX}px) and (prefers-reduced-motion: no-preference)` as const
