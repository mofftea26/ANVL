import { useCallback, useRef, useState } from 'react'
import { MODAL_FORGE_TUNING, type ForgeRect } from '@/shared/lib/forge/emberForge'
import type { AltarState } from './altarState'

/**
 * THE CANVAS → DOM EMBER HAND-OFF CONTRACT.
 *
 * At the hand-off beat (`ALTAR_FORGE.handoffAfterImpact`) the struck orb's
 * in-canvas shroud cross-fades out and the app's shared canvas-2D ember swarm
 * — the very same one that materializes every `<Modal>` and every toast — takes
 * over, tinted with the orb's colour, and converges to form the modal panel.
 * For that to read as ONE swarm crossing the boundary rather than two effects,
 * the DOM swarm has to start where the stone actually came apart: this module
 * turns the 3D orb seat, and the shroud's radius around it, into the origin and
 * the launch-ring size the shared engine needs, both in viewport pixels.
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
  /** Launch-ring multiplier (see {@link deriveSwarmSpreadScale}). */
  spreadScale?: number
}

/** The in-canvas seat reading (`AltarState.seatNdc`), resolved to pixels. */
export type AltarSeatProjection = {
  /** The seat in viewport pixels — the swarm's scatter origin. */
  origin: { x: number; y: number }
  /** The shroud's outer radius in viewport pixels (0 when unmeasured). */
  shroudOuterPx: number
}

/**
 * The exact inverse of the modal-rect → NDC conversion the in-canvas formation
 * used to do: the orb seat's NDC — and the shroud radius around it — as written
 * every frame by `AltarScene`'s `SeatProjector` through the same scene camera
 * (which drifts with the pointer and rattles on impact), converted to viewport
 * pixels via the canvas element's own box.
 *
 * Called once per strike, at the hand-off beat — never in a frame loop — so its
 * `getBoundingClientRect` costs a single layout read and is always fresh.
 * `undefined` (no canvas, or a zero-sized one) lets the swarm fall back to
 * `ForgeEmberCanvas`'s own defaults: the rect's centre, canonical ring.
 */
export function projectSeatToViewport(
  canvas: HTMLElement | null,
  seat: { x: number; y: number; radius: number },
): AltarSeatProjection | undefined {
  if (!canvas) return undefined
  const box = canvas.getBoundingClientRect()
  if (box.width === 0 || box.height === 0) return undefined
  return {
    origin: {
      x: box.left + ((seat.x + 1) / 2) * box.width,
      y: box.top + ((1 - seat.y) / 2) * box.height,
    },
    // NDC x spans 2 across the box, so an x-offset of `radius` covers that
    // fraction of the box's width.
    shroudOuterPx: (seat.radius / 2) * box.width,
  }
}

/** Floor on the derived scale — a degenerate measurement must never collapse
 *  the swarm into a single point sitting on the origin. */
const MIN_SPREAD_SCALE = 0.15

/**
 * The `spreadScale` that puts the DOM swarm's launch ring ON the in-canvas
 * shroud instead of far outside it.
 *
 * The engine launches each ember `max(rect.width, rect.height) × (spreadBase +
 * random × spreadRange) × spreadScale` from the origin, so at `spreadScale = 1`
 * its widest ember starts `1.25 × the rect's longest side` out — on the altar's
 * measured 672×704 panel that is ~880px, while the shroud those embers are
 * meant to be continuing only reaches ~300px. Scaling the ring so its OUTER
 * edge lands on the shroud's outer edge lines the two up:
 *
 *     spreadScale = shroudOuterPx / ((spreadBase + spreadRange) × reach)
 *
 * Both inputs are measured rather than assumed — the shroud radius through the
 * live camera, the reach from the panel's real rect — so this tracks the
 * viewport, the camera parallax, and each orb's own panel height instead of
 * baking in a magic number. The ring's inner edge follows proportionally
 * (`spreadBase / (spreadBase + spreadRange)` = 44% of the outer), close to the
 * shroud's own ~38% inner/outer ratio, so the whole band matches, not just its
 * rim.
 *
 * HORIZONTAL match, deliberately. `shroudOuterPx` is an x-offset, and the
 * engine's launch ring is an ellipse — `projectEmber` squashes y by `0.8` — so
 * the ring meets the shroud's rim left and right while its top and bottom sit
 * ~20% inside it. Dividing the vertical case out is not possible through a
 * single scalar, and compensating by widening the whole ring `/0.8` would push
 * the horizontal 25% OUTSIDE the shroud. Erring inside the shroud is safe (the
 * embers simply start among the ones they're replacing); erring outside is the
 * seam this exists to prevent. So: inside on the short axis, on the rim on the
 * long one. Returns `1` — the canonical modal ring — when an input is unusable.
 */
export function deriveSwarmSpreadScale(shroudOuterPx: number, rect: ForgeRect): number {
  const reach = Math.max(rect.width, rect.height)
  const engineOuter = MODAL_FORGE_TUNING.spreadBase + MODAL_FORGE_TUNING.spreadRange
  if (!(shroudOuterPx > 0) || !(reach > 0) || !(engineOuter > 0)) return 1
  return Math.max(MIN_SPREAD_SCALE, Math.min(1, shroudOuterPx / (engineOuter * reach)))
}

/** Everything the hand-off captures at the strike, before the panel exists. */
type ArmedSwarm = {
  key: number
  tint?: string
  seat?: AltarSeatProjection
}

export interface AltarEmberHandoff {
  /** The pass to render, or `null` when nothing is forging. */
  swarm: AltarEmberSwarm | null
  /** Call at the hand-off beat: capture the orb's colour and its seat NOW,
   *  through the live camera, before the modal's backdrop covers the stage. */
  armSwarm: (index: number) => void
  /** The modal panel's pre-transform rect. Stores it, and launches an armed
   *  swarm against it (the rect is the launch ring's missing input). */
  handlePanelMeasure: (rect: DOMRect) => void
  /** Live rect getter for `ForgeEmberCanvas` — `null` ends the pass. */
  swarmRect: () => ForgeRect | null
  /** The pass landed (`onComplete`). */
  retireSwarm: () => void
  /** The modal closed — drop the pass, the armed capture and the rect. */
  resetSwarm: () => void
}

export interface AltarEmberHandoffOptions {
  /** Only `seatNdc` is read — the in-canvas projector's per-frame output. */
  state: Pick<AltarState, 'seatNdc'>
  /** Only each orb's colour is read; structurally typed so this module stays
   *  independent of the About content schema (and trivial to test). */
  orbs: readonly { color?: string }[]
  reducedMotion: boolean
  /** The altar's WebGL canvas host — the box NDC is resolved against. */
  canvasBox: React.RefObject<HTMLElement | null>
}

/**
 * The DOM half of the hand-off, as one hook: **arm** at the hand-off beat,
 * **launch** when the panel reports its rect, **retire** when the pass lands or
 * the modal closes.
 *
 * Arming and launching are separate because they need different things at
 * different moments. The seat has to be projected at the hand-off beat, while
 * the camera is still live and unobscured; the launch ring's scale needs the
 * panel's rect, which does not exist until the modal mounts one commit later.
 * The modal reports that rect from a LAYOUT effect, so the `setSwarm` here is
 * flushed synchronously before the browser paints — the swarm still appears on
 * the hand-off frame, and it can never mount without a rect to aim at.
 *
 * Under reduced motion nothing is ever armed, so nothing is ever launched.
 */
export function useAltarEmberHandoff({
  state,
  orbs,
  reducedMotion,
  canvasBox,
}: AltarEmberHandoffOptions): AltarEmberHandoff {
  const [swarm, setSwarm] = useState<AltarEmberSwarm | null>(null)
  const swarmKey = useRef(0)
  const armed = useRef<ArmedSwarm | null>(null)
  const panelRect = useRef<ForgeRect | null>(null)

  const armSwarm = useCallback(
    (index: number) => {
      if (reducedMotion) {
        armed.current = null
        return
      }
      swarmKey.current += 1
      armed.current = {
        key: swarmKey.current,
        tint: orbs[index]?.color?.trim() || undefined,
        seat: projectSeatToViewport(canvasBox.current, state.seatNdc),
      }
    },
    [canvasBox, orbs, reducedMotion, state],
  )

  const handlePanelMeasure = useCallback((rect: DOMRect) => {
    const forgeRect: ForgeRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
    panelRect.current = forgeRect
    const pending = armed.current
    if (!pending) return
    armed.current = null
    setSwarm({
      key: pending.key,
      tint: pending.tint,
      origin: pending.seat?.origin,
      spreadScale: pending.seat
        ? deriveSwarmSpreadScale(pending.seat.shroudOuterPx, forgeRect)
        : undefined,
    })
  }, [])

  const swarmRect = useCallback(() => panelRect.current, [])
  const retireSwarm = useCallback(() => setSwarm(null), [])
  const resetSwarm = useCallback(() => {
    setSwarm(null)
    armed.current = null
    panelRect.current = null
  }, [])

  return { swarm, armSwarm, handlePanelMeasure, swarmRect, retireSwarm, resetSwarm }
}
