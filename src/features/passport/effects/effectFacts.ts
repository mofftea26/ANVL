import type {
  ResolvedPassportContent,
  ResolvedPassportMarker,
} from '../lib/resolvePassportContent'

/**
 * The authored readouts the shape-registered effects pin to the piece.
 *
 * Blueprint, Specifications and Fit each draw short label/value readouts over
 * the garment. Two earlier sources were rejected before this one:
 *
 * 1. **Constants** ("220 GSM", "12 SPI", a width from a made-up 72 cm scale) —
 *    invented specs on a document whose whole promise is that it tells the
 *    truth about THIS piece.
 * 2. **Derived from the section cards** — true, but nobody chose where the
 *    readouts landed; positions came from sampling the silhouette, so a spec
 *    could sit anywhere the geometry happened to put it.
 *
 * So they are authored: clicked onto the render in the CMS, named, valued.
 * Each marker carries its own `x`/`y` as a percent of the image box, the same
 * convention the hero hotspots use, so it holds its spot at any display size.
 * Turning that percent into a position on the DISPLAYED (object-contain)
 * render is `lib/markerGeometry.ts`, shared by all three effects so a marker
 * cannot land in a different place per section; a marker carrying no usable
 * position falls back to that effect's own designed geometry.
 *
 * This module is now a thin, honest read — no inference, no fallbacks. What an
 * editor placed is what the storefront shows; what they did not place does not
 * appear. The resolver has already dropped markers with neither label nor
 * value and clamped every coordinate.
 */

/** One authored readout: a labelled fact at a place on the garment. */
export type PassportEffectMarker = ResolvedPassportMarker

export interface PassportEffectFacts {
  /** Hologram spec tags. */
  blueprint: PassportEffectMarker[]
  /** Analysis chips. */
  specs: PassportEffectMarker[]
  /** Tape-band measurement readouts. */
  fit: PassportEffectMarker[]
}

/** The no-data shape. Effects treat it exactly like a failed sample. */
export const EMPTY_PASSPORT_EFFECT_FACTS: PassportEffectFacts = {
  blueprint: [],
  specs: [],
  fit: [],
}

/**
 * Collect the authored markers for the three effects that draw readouts.
 *
 * Pure and synchronous — hosts memoize it on `content`. Order is the authoring
 * order, which is the editor's own: an effect with room for three tags takes
 * the first three and stays truthful about the rest simply by not drawing it.
 */
export function buildPassportEffectFacts(
  content: ResolvedPassportContent,
): PassportEffectFacts {
  return {
    blueprint: content.blueprint.points,
    specs: content.specs.points,
    fit: content.fit.points,
  }
}
