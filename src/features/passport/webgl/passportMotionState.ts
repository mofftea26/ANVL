/**
 * Mutable DOM⇄WebGL bridge for the passport forge (oathMotionState pattern —
 * plain fields, no React state in the hot path). The DOM console writes;
 * the particle frame loop reads/lerps.
 */
export interface PassportMotionState {
  /** Increment to trigger a full shatter → reform cycle (section transitions). */
  shatter: number
  /** 0..1 resolve state of the DOM product render (DOM-tweened). */
  reveal: number
  /** 0..1 hover attention on the piece stage. */
  hover: number
  /** Pointer normalized to the viewport centre (-1..1). */
  pointerX: number
  pointerY: number
  /**
   * Measured viewport rect of the DOM product render (px). The particle form
   * registers its position AND scale to this every frame, so the ember
   * silhouette always matches the rendered image 1:1 — never floats larger.
   */
  stage: { cx: number; cy: number; dim: number } | null
}

export function createPassportMotionState(): PassportMotionState {
  return { shatter: 0, reveal: 0, hover: 0, pointerX: 0, pointerY: 0, stage: null }
}
