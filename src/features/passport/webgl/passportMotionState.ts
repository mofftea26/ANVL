/**
 * Mutable DOM⇄WebGL bridge for the passport forge (oathMotionState pattern —
 * plain fields, no React state in the hot path). The DOM console writes;
 * the particle frame loop reads.
 */
export interface PassportCardRect {
  /** Viewport px (getBoundingClientRect space). */
  x: number
  y: number
  w: number
  h: number
}

export interface PassportMotionState {
  /** Increment to dissolve the ember layout into the veil (transition out). */
  shatter: number
  /**
   * Measured rects of the visible bento cards / detail panel. The particles
   * trace THESE shapes (borders + sparse fill) — bump `cardRectsVersion`
   * after writing so the frame loop rebuilds and re-forges the cloud.
   */
  cardRects: PassportCardRect[]
  cardRectsVersion: number
  /** 0..1 — how far the DOM cards have resolved; embers recede (never fully). */
  reveal: number
  /** Pointer normalized to the viewport centre (-1..1) — feeds the dust. */
  pointerX: number
  pointerY: number
}

export function createPassportMotionState(): PassportMotionState {
  return {
    shatter: 0,
    cardRects: [],
    cardRectsVersion: 0,
    reveal: 0,
    pointerX: 0,
    pointerY: 0,
  }
}
