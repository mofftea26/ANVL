/**
 * Shared choreography clock for the registration ceremony. The DOM overlay and
 * the particle forge never call each other — both schedule GSAP against these
 * constants.
 *
 * The ceremony is INTERACTIVE (user-specified): the ANVL crest stands in
 * embers, breathing; the owner strikes it (taps) — each strike pulses the
 * cloud — and the FINAL strike begins the forge. All times below are offsets
 * from that final strike. Phases stay deliberately unhurried and non-
 * overlapping: disperse → beat → regroup → and only after the silhouette has
 * fully landed does the crisp render resolve.
 *
 * The claim RPC has already succeeded before any of this — the ceremony never
 * gates registration.
 */

/** Strikes required to begin the forge (the last one triggers it). */
export const CEREMONY_STRIKES = 3
/** Phase 1 (from the final strike): crest → scatter cloud. */
export const CEREMONY_DISPERSE_DURATION = 0.9
/** A held breath while fully dispersed. */
export const CEREMONY_REGROUP_AT = CEREMONY_DISPERSE_DURATION + 0.15
/** Phase 2: scatter cloud → the piece's silhouette (smooth, never snappy). */
export const CEREMONY_REGROUP_DURATION = 1.4
/** Phase 3: the crisp render resolves ONLY after the silhouette has landed. */
export const CEREMONY_REVEAL_AT = CEREMONY_REGROUP_AT + CEREMONY_REGROUP_DURATION + 0.12
export const CEREMONY_REVEAL_DURATION = 0.6
/** Plate (name + seal) and the Continue button settle in. */
export const CEREMONY_PLATE_AT = CEREMONY_REVEAL_AT + 0.35
