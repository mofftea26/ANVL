/**
 * THE CANVAS → DOM EMBER HAND-OFF CONTRACT.
 *
 * At the hand-off beat (`ALTAR_FORGE.handoffAfterImpact`) the struck orb's
 * in-canvas shroud cross-fades out and the app's shared canvas-2D ember swarm
 * — the very same one that materializes every `<Modal>` and every toast — takes
 * over, tinted with the orb's colour, and converges to form the modal panel.
 * For that to read as ONE swarm crossing the boundary rather than two effects,
 * the DOM swarm has to launch from where the stone actually came apart. That is
 * this module: the 3D orb seat, expressed in viewport pixels.
 */

/** One tinted DOM ember pass — mounted at the hand-off, unmounted when it lands. */
export type AltarEmberSwarm = {
  /** Fresh per strike, so React remounts (and therefore restarts) the pass. */
  key: number
  /**
   * The struck orb's colour — the ember ramp is rebuilt around it. `undefined`
   * (an orb with no colour set) falls back to the site's own ember ramp, the
   * same one every untinted modal and toast uses.
   */
  tint?: string
  /** The orb's seat in viewport pixels (see {@link projectSeatToViewport}). */
  origin?: { x: number; y: number }
}

/**
 * The exact inverse of the modal-rect → NDC conversion the in-canvas formation
 * used to do: the orb seat's NDC (written every frame by `AltarScene`'s
 * `SeatProjector`, through the same scene camera that drifts with the pointer
 * and rattles on impact) → viewport pixels, via the canvas element's own box.
 *
 * Called once per strike, at the hand-off beat — never in a frame loop — so its
 * `getBoundingClientRect` costs a single layout read and is always fresh.
 * `undefined` (no canvas, or a zero-sized one) lets the swarm fall back to the
 * panel's centre, which is `ForgeEmberCanvas`'s own default origin.
 */
export function projectSeatToViewport(
  canvas: HTMLElement | null,
  ndc: { x: number; y: number },
): { x: number; y: number } | undefined {
  if (!canvas) return undefined
  const box = canvas.getBoundingClientRect()
  if (box.width === 0 || box.height === 0) return undefined
  return {
    x: box.left + ((ndc.x + 1) / 2) * box.width,
    y: box.top + ((1 - ndc.y) / 2) * box.height,
  }
}
