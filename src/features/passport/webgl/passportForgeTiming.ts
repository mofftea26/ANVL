/**
 * Shared choreography clock for the passport forge (the particle-forge
 * standard — see docs/animation-guidelines.md). The WebGL particles and the
 * DOM console never call each other; both schedule GSAP against these
 * constants so ember settle, render reveal, and content swaps stay in
 * lock-step by construction.
 */

/** Beat before anything moves (page settles, fonts paint). */
export const PASSPORT_ENTRY_DELAY = 0.3
/** Scatter nebula → the piece's silhouette. */
export const PASSPORT_ASSEMBLE_DURATION = 2.0
/** The DOM render resolve (fade/unblur) once the embers settle. */
export const PASSPORT_REVEAL_DURATION = 0.9
/** Reveal starts slightly before the assembly settles (fusion, not pop-in). */
export const PASSPORT_FIRST_REVEAL_AT =
  PASSPORT_ENTRY_DELAY + PASSPORT_ASSEMBLE_DURATION - 0.1

/** Section transition: silhouette → full-screen shatter cloud. */
export const PASSPORT_SHATTER_OUT = 0.6
/** Hold dispersed while the DOM swaps content underneath. */
export const PASSPORT_SHATTER_HOLD = 0.2
/** Shatter cloud → back into the silhouette. */
export const PASSPORT_SHATTER_IN = 1.0
/** When (s from a shatter) the DOM swaps + starts forming the new content in. */
export const PASSPORT_SWAP_AT = PASSPORT_SHATTER_OUT + PASSPORT_SHATTER_HOLD * 0.5
