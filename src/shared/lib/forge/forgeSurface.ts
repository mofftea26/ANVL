import {
  FORGE_EMBER_GROWTH,
  FORGE_LAUNCH_Y_SQUASH,
  MODAL_FORGE_TUNING,
  type ForgeMotionTuning,
  type ForgeRect,
} from './emberForge'

/**
 * HOW BIG, AND HOW SHARP, A FORGE SURFACE HAS TO BE.
 *
 * The companion to `emberForge.ts`: that module decides where every ember goes
 * and what it looks like, this one decides the canvas it needs. Split out
 * because it is a genuinely separate concern (surface geometry, not ember
 * maths) and because `ForgeEmberCanvas` needs these as pure, testable
 * functions rather than helpers buried in a React effect.
 *
 * The reason it exists at all: an ember swarm is a sub-second transient that
 * occupies a *known* box, and a full-viewport canvas for it is a full-viewport
 * compositor layer being allocated, cleared, and sampled every frame for the
 * sake of a few hundred 2px discs. On the About altar — whose swarm launches
 * from a ring sized to the in-canvas shroud rather than the engine's default —
 * the box is 38% of the viewport's pixels, and combined with
 * {@link FORGE_MAX_DPR} that is a 4.7× smaller surface (1.1 Mpx against 5.2 Mpx
 * at 1440×900).
 */

/**
 * Device-pixel-ratio ceiling for every forge surface.
 *
 * Capped at 1.5 rather than the usual 2. The swarm is a sub-second additive
 * glow of soft-edged discs 1.6–4.3 CSS px across — no text, no hard edges, and
 * its own antialiasing is already sub-pixel — so extra sample density buys
 * nothing perceptible, while a 2× overlay costs ~78% more layer pixels for the
 * compositor to allocate and sample every frame. Measured *in-process* draw cost
 * is flat against DPR (the engine is per-draw-call bound, not fill-rate bound),
 * so the saving here is compositor-side memory and bandwidth, not rasterization.
 *
 * Shared by every surface — a dialog and a toast must never read as different
 * resolutions.
 */
export const FORGE_MAX_DPR = 1.5

/**
 * The viewport-space box the swarm can possibly paint into: the union of the
 * launch ellipse around `origin` and the target `rect`, padded by the largest
 * radius any ember draws.
 *
 * Coordinates are in the same space as `Ember.fx/fy/tx/ty`, so a caller can
 * clamp it with {@link clampBoxToViewport} and fold the offset into its own
 * transform. Anything this box misses gets clipped, so it is deliberately
 * derived from the tuning rather than estimated — see the test that walks a real
 * swarm and asserts containment.
 */
export function forgeSwarmBounds(options: {
  rect: ForgeRect
  origin?: { x: number; y: number }
  spreadScale?: number
  tuning?: ForgeMotionTuning
}): ForgeRect {
  const { rect, origin, spreadScale = 1, tuning = MODAL_FORGE_TUNING } = options
  const cx = origin?.x ?? rect.left + rect.width / 2
  const cy = origin?.y ?? rect.top + rect.height / 2
  // The widest launch reach `projectEmber` can produce, and its y-squashed twin.
  const rx =
    Math.max(rect.width, rect.height) *
    (tuning.spreadBase + tuning.spreadRange) *
    Math.max(0, spreadScale)
  const ry = rx * FORGE_LAUNCH_Y_SQUASH
  // The biggest disc drawn: an unlanded ember at its maximum base radius, plus
  // the landing jitter, plus a pixel for the antialiased rim.
  const pad =
    (tuning.radiusBase + tuning.radiusRange) * (1 + FORGE_EMBER_GROWTH) +
    tuning.landingJitterPx +
    1

  const left = Math.min(cx - rx, rect.left) - pad
  const top = Math.min(cy - ry, rect.top) - pad
  const right = Math.max(cx + rx, rect.left + rect.width) + pad
  const bottom = Math.max(cy + ry, rect.top + rect.height) + pad
  return { left, top, width: right - left, height: bottom - top }
}

/** Whole device pixels, and never a pixel of surface outside the viewport. */
export function clampBoxToViewport(box: ForgeRect, vw: number, vh: number): ForgeRect {
  const left = Math.max(0, Math.floor(box.left))
  const top = Math.max(0, Math.floor(box.top))
  const right = Math.min(vw, Math.ceil(box.left + box.width))
  const bottom = Math.min(vh, Math.ceil(box.top + box.height))
  return { left, top, width: right - left, height: bottom - top }
}

export function containsBox(outer: ForgeRect, inner: ForgeRect): boolean {
  return (
    outer.left <= inner.left &&
    outer.top <= inner.top &&
    outer.left + outer.width >= inner.left + inner.width &&
    outer.top + outer.height >= inner.top + inner.height
  )
}

export function unionBox(a: ForgeRect, b: ForgeRect): ForgeRect {
  const left = Math.min(a.left, b.left)
  const top = Math.min(a.top, b.top)
  const right = Math.max(a.left + a.width, b.left + b.width)
  const bottom = Math.max(a.top + a.height, b.top + b.height)
  return { left, top, width: right - left, height: bottom - top }
}
