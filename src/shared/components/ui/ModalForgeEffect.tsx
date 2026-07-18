import { useEffect, useRef } from 'react'
import { readThemeCssColor } from '@/shared/lib/themeColor'

/**
 * The shared modal's ember materialization — every dialog in the app forges
 * open the way the armory bentos do: a swarm of theme-ramp embers converges
 * from a scattered ring onto the panel's rectangle (perimeter first, a sparse
 * face fill behind it), holds a beat, and dissolves as the real panel fades
 * in underneath (see `.anvl-modal-forge` in styles.css for the panel's side
 * of the handshake).
 *
 * Deliberately canvas-2D, not three.js: the Modal lives in the shared UI
 * chunk that admin and storefront both load, and ~500 arcs for under a second
 * is far below canvas-2D's budget — no `vendor-three` in the shared path.
 * Callers must skip rendering this under reduced motion.
 */

const DURATION_MS = 950
const COUNT = 520
/** Share of embers tracing the panel's border (the rest dust its face). */
const EDGE_SHARE = 0.62

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

interface Ember {
  fx: number
  fy: number
  tx: number
  ty: number
  seed: number
  r: number
  color: string
}

export function ModalForgeEffect({
  targetRef,
}: {
  /** The panel the embers form — measured once on mount. */
  targetRef: React.RefObject<HTMLDivElement | null>
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const target = targetRef.current
    if (!canvas || !target) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const vw = window.innerWidth
    const vh = window.innerHeight
    canvas.width = Math.floor(vw * dpr)
    canvas.height = Math.floor(vh * dpr)
    ctx.scale(dpr, dpr)

    const rect = target.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    // The site ember ramp, read from the live theme.
    const cold = readThemeCssColor('--color-heading', '#E7E4DF')
    const ember = readThemeCssColor('--color-highlight', '#c2703d')
    const hot = readThemeCssColor('--color-highlight-bright', '#e08a4a')

    const edgeCount = Math.floor(COUNT * EDGE_SHARE)
    const perimeter = 2 * (rect.width + rect.height)
    const embers: Ember[] = Array.from({ length: COUNT }, (_, i) => {
      let tx: number
      let ty: number
      if (i < edgeCount) {
        // Walk the panel's perimeter at an even pace.
        let d = ((i + Math.random()) / edgeCount) * perimeter
        if (d < rect.width) {
          tx = rect.left + d
          ty = rect.top
        } else if (d < rect.width + rect.height) {
          tx = rect.right
          ty = rect.top + (d - rect.width)
        } else if (d < rect.width * 2 + rect.height) {
          d -= rect.width + rect.height
          tx = rect.right - d
          ty = rect.bottom
        } else {
          d -= rect.width * 2 + rect.height
          tx = rect.left
          ty = rect.bottom - d
        }
      } else {
        tx = rect.left + Math.random() * rect.width
        ty = rect.top + Math.random() * rect.height
      }
      const ang = Math.random() * Math.PI * 2
      const spread = Math.max(rect.width, rect.height) * (0.55 + Math.random() * 0.7)
      const heat = Math.random()
      return {
        fx: cx + Math.cos(ang) * spread,
        fy: cy + Math.sin(ang) * spread * 0.8,
        tx: tx + (Math.random() - 0.5) * 2,
        ty: ty + (Math.random() - 0.5) * 2,
        seed: Math.random(),
        r: 0.8 + Math.random() * 1.6,
        color: heat < 0.22 ? cold : heat < 0.82 ? ember : hot,
      }
    })

    let raf = 0
    const start = performance.now()
    const draw = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS)
      ctx.clearRect(0, 0, vw, vh)
      ctx.globalCompositeOperation = 'lighter'
      const dissolve = smoothstep(0.62, 0.98, t)
      for (const e of embers) {
        const p = smoothstep(0, 1, Math.min(1, Math.max(0, t * 1.55 - e.seed * 0.45)))
        const alpha =
          (0.25 + 0.75 * p) * (1 - dissolve) * (0.7 + 0.3 * Math.sin(now * 0.02 + e.seed * 40))
        if (alpha <= 0.015) continue
        const x = e.fx + (e.tx - e.fx) * p
        const y = e.fy + (e.ty - e.fy) * p
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.fillStyle = e.color
        ctx.beginPath()
        ctx.arc(x, y, e.r * (1 + (1 - p) * 0.8), 0, Math.PI * 2)
        ctx.fill()
        // Landed embers burn a hot core just before fusing into the panel.
        if (p > 0.85) {
          ctx.globalAlpha = Math.min(1, alpha * 0.9)
          ctx.fillStyle = hot
          ctx.beginPath()
          ctx.arc(x, y, e.r * 0.45, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      if (t < 1) {
        raf = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, vw, vh)
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [targetRef])

  // Above the panel while forming (the swarm draws the panel), below popovers.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[95] h-full w-full"
    />
  )
}
