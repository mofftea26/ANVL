/**
 * Shared choreography clock for the passport forge (the particle-forge
 * standard — see docs/animation-guidelines.md). The WebGL particles and the
 * DOM console never call each other; both schedule GSAP against these
 * constants so ember settle, render reveal, and content swaps stay in
 * lock-step by construction.
 */

/** Beat before anything moves (page settles, fonts paint). */
export const PASSPORT_ENTRY_DELAY = 0.2
/** Scatter nebula → the piece's silhouette (snappy, not languid). */
export const PASSPORT_ASSEMBLE_DURATION = 1.1
/** The DOM render resolve (fade/unblur) once the embers settle. */
export const PASSPORT_REVEAL_DURATION = 0.55
/** Reveal starts slightly before the assembly settles (fusion, not pop-in). */
export const PASSPORT_FIRST_REVEAL_AT =
  PASSPORT_ENTRY_DELAY + PASSPORT_ASSEMBLE_DURATION - 0.1

/** Section transition: silhouette → a veil bounded to the cards' own region
 *  (never the whole page), kept brisk so the swap reads as one continuous
 *  disperse→recollect rather than a stall in scattered dust. */
export const PASSPORT_SHATTER_OUT = 0.42
/** Barely hold dispersed — recollect almost immediately (continuous feel). */
export const PASSPORT_SHATTER_HOLD = 0.08
/** Veil → back into the new card shapes (fast recollect). */
export const PASSPORT_SHATTER_IN = 0.72
/** When (s from a shatter) the DOM swaps + starts forming the new content in.
 *  Driven by setTimeout in the console (never a mid-timeline GSAP callback —
 *  the content swap must survive even if the animation clock stalls). */
export const PASSPORT_SWAP_AT = 0.34
