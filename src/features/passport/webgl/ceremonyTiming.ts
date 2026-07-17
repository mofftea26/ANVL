/**
 * Shared choreography clock for the registration ceremony. The DOM overlay and
 * the particle forge never call each other — both schedule GSAP against these
 * constants.
 *
 * The beat sheet (user-specified): the ANVL crest stands in embers for half a
 * second → the embers disperse → they reassemble into the registered piece →
 * the crisp image resolves and the plate + "Continue to your Armory" button
 * appear. Nothing auto-advances — the owner leaves via the button.
 *
 * Seconds from ceremony mount. The claim RPC has already succeeded by the time
 * any of this runs — the ceremony never gates registration.
 */

/** The crest stands fully formed for this long before dispersing. */
export const CEREMONY_CREST_HOLD = 0.5
/** Crest → disperse → the piece's silhouette (one continuous morph). */
export const CEREMONY_MORPH_DURATION = 1.3
/** The crisp product image resolves as the embers dissolve into it. */
export const CEREMONY_REVEAL_AT = CEREMONY_CREST_HOLD + CEREMONY_MORPH_DURATION - 0.15
export const CEREMONY_REVEAL_DURATION = 0.5
/** Plate (name + seal) and the Continue button settle in. */
export const CEREMONY_PLATE_AT = CEREMONY_REVEAL_AT + 0.25
