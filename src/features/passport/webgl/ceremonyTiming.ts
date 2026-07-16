/**
 * Shared choreography clock for the registration ceremony ("The
 * Authentication"). The DOM timeline and the crest particle forge never call
 * each other — both schedule GSAP against these constants, so the embers form
 * the crest exactly as the solid seal resolves out of them.
 *
 * Seconds from ceremony mount. The claim RPC has already succeeded by the time
 * any of this runs — the ceremony never gates registration.
 */

/** Beat of darkness before the beam. */
export const CEREMONY_SCAN_AT = 0.35
/** The champagne beam sweeping down the piece (and revealing it). */
export const CEREMONY_SCAN_DURATION = 1.15
/** Verification lines start ticking in (real record data). */
export const CEREMONY_LINES_AT = 1.35
export const CEREMONY_LINE_STAGGER = 0.17
/** Embers gather into the ANVL crest. */
export const CEREMONY_CREST_AT = 2.35
export const CEREMONY_CREST_DURATION = 1.0
/** The seal locks: the solid crest resolves as the embers vanish into it. */
export const CEREMONY_SEAL_AT = 3.25
export const CEREMONY_SEAL_DURATION = 0.7
/** The owner's name settles onto the plate. */
export const CEREMONY_NAME_AT = 3.85
/** "Added to your Armory". */
export const CEREMONY_ARMORY_AT = 4.5
/** Hand-off to the passport. */
export const CEREMONY_END_AT = 5.5
