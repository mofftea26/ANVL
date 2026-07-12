/**
 * Shared choreography clock for the hero product forge.
 *
 * The forge is split across two trees — the WebGL particles (entry assembly,
 * morphs) and the DOM stage (the actual product render that resolves in once
 * the embers settle). They never call each other; both schedule GSAP work
 * against these constants, so the ember form and the render reveal stay in
 * lock-step by construction.
 */

/** Beat before anything moves (page settles, fonts paint). */
export const FORGE_ENTRY_DELAY = 0.4
/** Scatter nebula → lineup of every piece. */
export const FORGE_ASSEMBLE_DURATION = 2.4
/** Hold on the lineup before converging into piece 01. */
export const FORGE_LINEUP_HOLD = 1.1
/** Every ember morph (lineup → piece, piece → piece). */
export const FORGE_MORPH_DURATION = 1.6
/** The render resolve (fade/unblur/cool-down) once embers settle. */
export const FORGE_REVEAL_DURATION = 0.9

/** How far before the morph settles the reveal starts. Kept tiny: the embers
 *  must be seen fully forming the product's silhouette first — the render
 *  then resolves *out of* the settled cloud (fusion), not alongside it. */
const REVEAL_LEAD = 0.1

/** When (s from mount) the converge-to-piece-01 morph starts. */
export const FORGE_CONVERGE_AT =
  FORGE_ENTRY_DELAY + FORGE_ASSEMBLE_DURATION + FORGE_LINEUP_HOLD

/** When (s from mount) the first product render starts resolving in. */
export const FORGE_FIRST_REVEAL_AT =
  FORGE_CONVERGE_AT + FORGE_MORPH_DURATION - REVEAL_LEAD

/** When (s from a strike) the next product render starts resolving in. */
export const FORGE_STRIKE_REVEAL_AT = FORGE_MORPH_DURATION - REVEAL_LEAD
