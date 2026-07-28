import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import {
  buildEmbers,
  drawForgeFrame,
  FORGE_DURATION_MS,
  projectEmber,
  resolveForgeRamp,
  type ForgeRect,
} from '@/shared/lib/forge/emberForge'

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

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const vw = window.innerWidth
    const vh = window.innerHeight
    canvas.width = Math.floor(vw * dpr)
    canvas.height = Math.floor(vh * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const ramp = resolveForgeRamp(tint)
    const embers = buildEmbers({ rect: initialRect, origin, ramp, count, edgeShare })

    let raf = 0
    const start = performance.now()
    const draw = (now: number) => {
      if (live) {
        const rect = getRectRef.current?.()
        if (!rect) {
          // The target left the DOM — stop immediately (mirrors the old
          // ToastForgeEffect's "self-remove the moment the node disconnects").
          ctx.clearRect(0, 0, vw, vh)
          onCompleteRef.current?.()
          return
        }
        for (const ember of embers) projectEmber(ember, rect, origin)
      }

      const t = Math.min(1, (now - start) / durationMs)
      ctx.clearRect(0, 0, vw, vh)
      drawForgeFrame(ctx, embers, { t, now, ramp })

      if (t < 1) {
        raf = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, vw, vh)
        onCompleteRef.current?.()
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
    // Depend on origin's scalars, not its identity — callers commonly pass a
    // fresh `{ x, y }` literal every render, and restarting the whole swarm
    // just because of that (rather than an actual position change) would
    // visibly reset the animation mid-flight.
  }, [reducedMotion, targetRef, tint, durationMs, count, edgeShare, origin?.x, origin?.y])

  if (reducedMotion) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex }}
    />
  )
}
