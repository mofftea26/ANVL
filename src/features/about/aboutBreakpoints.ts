/**
 * The About page tier contract:
 * - desktop altar: `≥1280px` (`xl+`) + no reduced motion + WebGL — the
 *   non-scrollable Forge Altar stage (3D anvil, aurora, orbiting orbs)
 * - everything else (mobile, tablet, reduced motion, no WebGL): the normal
 *   scrolling About page
 */
export const ABOUT_DESKTOP_MIN_PX = 1280

export const ABOUT_ALTAR_MQ =
  `(min-width: ${ABOUT_DESKTOP_MIN_PX}px) and (prefers-reduced-motion: no-preference)` as const
