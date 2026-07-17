/**
 * Shared choreography clock for the registration ceremony. The DOM overlay and
 * the particle forge never call each other — both schedule GSAP against these
 * constants.
 *
 * Three unmistakable phases (user-specified): the ANVL crest stands in embers
 * → the embers DISPERSE to a scatter cloud → they REGROUP into the registered
 * piece → the crisp render resolves with the plate and a "Continue to your
 * Armory" button. Nothing auto-advances.
 *
 * Seconds from ceremony mount. The claim RPC has already succeeded by the time
 * any of this runs — the ceremony never gates registration.
 */

/** The crest stands fully formed before anything moves. */
export const CEREMONY_CREST_HOLD = 0.5
/** Phase 1: crest → scatter cloud (a true disperse, not a mid-morph blur). */
export const CEREMONY_DISPERSE_DURATION = 0.5
/** Phase 2: scatter cloud → the piece's silhouette. */
export const CEREMONY_REGROUP_AT = CEREMONY_CREST_HOLD + CEREMONY_DISPERSE_DURATION
export const CEREMONY_REGROUP_DURATION = 0.8
/** Phase 3: the crisp product image resolves as the embers dissolve into it —
 *  only AFTER the silhouette has fully shaped. */
export const CEREMONY_REVEAL_AT = CEREMONY_REGROUP_AT + CEREMONY_REGROUP_DURATION - 0.08
export const CEREMONY_REVEAL_DURATION = 0.5
/** Plate (name + seal) and the Continue button settle in. */
export const CEREMONY_PLATE_AT = CEREMONY_REVEAL_AT + 0.3
