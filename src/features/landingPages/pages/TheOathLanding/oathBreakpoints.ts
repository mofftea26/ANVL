/**
 * The Oath landing breakpoint contract (Tailwind-aligned):
 * - mobile: `<768px` (`md`)
 * - tablet: `768px–1279px` (`md` through below `xl`) — static layout, no WebGL/GSAP pins
 * - desktop cinematic: `≥1280px` (`xl+`) — WebGL, ScrollTrigger pins, manifesto/tenets
 *
 * iPad Pro (1024px / 1366px logical widths) stays on the tablet path until 1280px.
 */
export const OATH_DESKTOP_MIN_PX = 1280

export const OATH_DESKTOP_CINEMATIC_MQ =
  `(min-width: ${OATH_DESKTOP_MIN_PX}px) and (prefers-reduced-motion: no-preference)` as const

export const OATH_STATIC_MQ =
  '(max-width: 1279.98px), (prefers-reduced-motion: reduce)' as const

export const OATH_FINE_POINTER_DESKTOP_MQ =
  `(pointer: fine) and (min-width: ${OATH_DESKTOP_MIN_PX}px) and (prefers-reduced-motion: no-preference)` as const
