/**
 * The About page breakpoint contract — mirrors The Oath landing's cinematic
 * gate exactly (Tailwind-aligned):
 * - mobile: `<768px` (`md`)
 * - tablet: `768px–1279px` (`md` through below `xl`) — static layout, no WebGL/GSAP pins
 * - desktop cinematic: `≥1280px` (`xl+`) — WebGL monolith, ScrollTrigger pins
 *
 * iPad Pro (1024px / 1366px logical widths) stays on the static path until 1280px.
 */
export const ABOUT_DESKTOP_MIN_PX = 1280

export const ABOUT_DESKTOP_CINEMATIC_MQ =
  `(min-width: ${ABOUT_DESKTOP_MIN_PX}px) and (prefers-reduced-motion: no-preference)` as const

export const ABOUT_STATIC_MQ =
  '(max-width: 1279.98px), (prefers-reduced-motion: reduce)' as const
