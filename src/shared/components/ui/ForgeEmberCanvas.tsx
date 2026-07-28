import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import {
  buildEmbers,
  drawForgeFrame,
  FORGE_DURATION_MS,
  projectEmber,
  resolveForgeRamp,
  type ForgeMotionTuning,
  type ForgeRect,
} from '@/shared/lib/forge/emberForge'
import {
  clampBoxToViewport,
  containsBox,
  FORGE_MAX_DPR,
  forgeSwarmBounds,
  unionBox,
} from '@/shared/lib/forge/forgeSurface'

/**
 * The React shell for the shared ember-forge engine (`src/shared/lib/forge/emberForge.ts`):
 * owns the canvas element, DPR scaling, the rAF loop, and teardown. One
 * mounted instance is one swarm converging on one rect for `durationMs`,
 * then it's done — `ModalForgeEffect` and `ToastForgeEffect` are thin
 * wrappers over this, and `AboutAltar` (Task 3) mounts it directly for the
 * altar handoff.
 *
 * Deliberately canvas-2D, not three.js — see the header comment in
 * `emberForge.ts` for the rationale (this lives in the shared UI chunk both
 * admin and storefront load).
 */

const DEFAULT_COUNT = 520
const DEFAULT_EDGE_SHARE = 0.62
const DEFAULT_Z_INDEX = 95

export interface ForgeEmberCanvasProps {
  /** The rect to form — measured once on mount. Mutually exclusive with `getRect`. */
  targetRef?: React.RefObject<HTMLElement | null>
  /** Or a live getter, re-measured every frame (e.g. a toast plate mid-restack). Return `null` to end the pass early. */
  getRect?: () => ForgeRect | null
  /** Scatter origin. Default: the rect's centre. */
  origin?: { x: number; y: number }
  /** Rebuilds the ramp around this colour. Unset = today's exact theme ramp. */
  tint?: string
  /** Which surface's motion numbers to use. Default: the modal's (`MODAL_FORGE_TUNING`). */
  tuning?: ForgeMotionTuning
  /**
   * Extra multiplier on the tuning's launch spread — how far out from `origin`
   * the swarm starts, as a fraction of the rect's longest side. Default `1`
   * (the tuning's own radius, i.e. exactly what modals and toasts do). Below 1
   * gathers from a tighter ring: the About altar uses it to launch its swarm
   * inside the in-canvas ember shroud it is taking over from.
   */
  spreadScale?: number
  durationMs?: number
  count?: number
  edgeShare?: number
  zIndex?: number
  onComplete?: () => void
}

function toForgeRect(rect: DOMRect): ForgeRect {
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

export function ForgeEmberCanvas({
  targetRef,
  getRect,
  origin,
  tint,
  tuning,
  spreadScale,
  durationMs = FORGE_DURATION_MS,
  count = DEFAULT_COUNT,
  edgeShare = DEFAULT_EDGE_SHARE,
  zIndex = DEFAULT_Z_INDEX,
  onComplete,
}: ForgeEmberCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reducedMotion = useReducedMotion()

  // `getRect`/`onComplete` are commonly fresh closures every render (the
  // toast wrapper passes `() => node.getBoundingClientRect()` per pass); read
  // the latest via refs inside the rAF loop instead of depending on them
  // directly, which would tear down and restart the whole swarm every render.
  const getRectRef = useRef(getRect)
  getRectRef.current = getRect
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / unsupported — bail cleanly.

    const live = !targetRef
    const initialRect = targetRef?.current
      ? toForgeRect(targetRef.current.getBoundingClientRect())
      : (getRectRef.current?.() ?? null)
    if (!initialRect) return

    const dpr = Math.min(window.devicePixelRatio || 1, FORGE_MAX_DPR)
    const vw = window.innerWidth
    const vh = window.innerHeight

    // The swarm occupies a known box (its launch ring unioned with the target
    // rect), so size, position and clear only that instead of always taking a
    // viewport-sized surface. How much that saves depends on the launch ring: a
    // `spreadScale`-tightened swarm like the About altar's needs 38% of the
    // viewport's pixels, while a default dialog's ring genuinely spans the
    // viewport and clamps back to it (no worse than before, and `FORGE_MAX_DPR`
    // still applies).
    let box = clampBoxToViewport(
      forgeSwarmBounds({ rect: initialRect, origin, spreadScale, tuning }),
      vw,
      vh,
    )
    // The whole swarm is off-screen: there is nothing to draw, but the caller
    // still has to be told the pass is over or it waits on a swarm that will
    // never land (the altar keeps its canvas mounted until `onComplete`).
    if (box.width <= 0 || box.height <= 0) {
      onCompleteRef.current?.()
      return
    }

    const applyBox = () => {
      canvas.style.left = `${box.left}px`
      canvas.style.top = `${box.top}px`
      canvas.style.width = `${box.width}px`
      canvas.style.height = `${box.height}px`
      canvas.width = Math.max(1, Math.round(box.width * dpr))
      canvas.height = Math.max(1, Math.round(box.height * dpr))
    }
    applyBox()

    /** Embers carry viewport coordinates; the box's own offset rides in the
     *  transform, so nothing downstream has to know the canvas moved. */
    const clearFrame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, -box.left * dpr, -box.top * dpr)
      ctx.clearRect(box.left, box.top, box.width, box.height)
    }

    /** A live caller's rect moves (a toast plate restacking mid-pass). Grow the
     *  box so the swarm is never clipped — grow only, so a drifting rect cannot
     *  thrash the surface. Resizing wipes it, which is harmless: every frame
     *  repaints from scratch. */
    const growBoxFor = (rect: ForgeRect) => {
      const needed = clampBoxToViewport(
        forgeSwarmBounds({ rect, origin, spreadScale, tuning }),
        vw,
        vh,
      )
      if (needed.width <= 0 || needed.height <= 0 || containsBox(box, needed)) return
      box = unionBox(box, needed)
      applyBox()
    }

    const ramp = resolveForgeRamp(tint)
    // `spreadScale` is forwarded as-is: `buildEmbers` defaults it to 1, so a
    // caller that omits it (ModalForgeEffect, ToastForgeEffect) builds exactly
    // the embers it built before this prop existed.
    const embers = buildEmbers({
      rect: initialRect,
      origin,
      ramp,
      count,
      edgeShare,
      spreadScale,
      tuning,
    })

    let raf = 0
    const start = performance.now()
    const draw = (now: number) => {
      if (live) {
        const rect = getRectRef.current?.()
        if (!rect) {
          // The target left the DOM — stop immediately (mirrors the old
          // ToastForgeEffect's "self-remove the moment the node disconnects").
          clearFrame()
          onCompleteRef.current?.()
          return
        }
        for (const ember of embers) projectEmber(ember, rect, origin)
        growBoxFor(rect)
      }

      const t = Math.min(1, (now - start) / durationMs)
      clearFrame()
      drawForgeFrame(ctx, embers, { t, now, ramp, tuning })

      if (t < 1) {
        raf = requestAnimationFrame(draw)
      } else {
        clearFrame()
        onCompleteRef.current?.()
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
    // Depend on origin's scalars, not its identity — callers commonly pass a
    // fresh `{ x, y }` literal every render, and restarting the whole swarm
    // just because of that (rather than an actual position change) would
    // visibly reset the animation mid-flight.
  }, [
    reducedMotion,
    targetRef,
    tint,
    tuning,
    spreadScale,
    durationMs,
    count,
    edgeShare,
    origin?.x,
    origin?.y,
  ])

  if (reducedMotion) return null

  // Geometry is set by the effect above (it needs a layout measurement), not
  // here — the swarm's box is smaller than the viewport. Starts collapsed so
  // there is never a viewport-sized surface, not even for the mount frame.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed"
      style={{ zIndex, left: 0, top: 0, width: 0, height: 0 }}
    />
  )
}
