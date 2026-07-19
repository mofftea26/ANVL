import { useEffect, useRef, useState } from 'react'
import { readThemeCssColor } from '@/shared/lib/themeColor'

/**
 * The toast forge layer — every sonner toast materializes out of embers the
 * way the shared Modal does (see {@link ModalForgeEffect} + `.anvl-modal-forge`).
 * A single fixed, full-viewport canvas watches the DOM for freshly-mounted
 * `[data-sonner-toast]` plates; each new plate spawns an independent, short
 * ember pass — a swarm converges from a scattered ring onto the plate's live
 * rectangle (perimeter-biased so the forged edge draws in first), lands, and
 * dissolves as the plate settles. Scaled down from the modal: far fewer embers,
 * ~0.7s, and the plate is never held back (sonner owns its own entrance), so
 * the embers simply crown the arrival.
 *
 * Deliberately canvas-2D, not three.js — toasts live in the shared UI chunk
 * that both admin and storefront load, and a handful of ~130-arc passes is far
 * below canvas-2D's budget. Keeping three.js out of the shared path mirrors
 * ModalForgeEffect's rationale exactly.
 *
 * Robustness:
 *  - One canvas + one RAF for every stacked toast; the loop idles (stops) the
 *    instant no pass is active and restarts when the next toast mounts.
 *  - Each pass re-measures its plate every frame from the live node, so embers
 *    track the plate as sonner stacks/shifts it.
 *  - Passes are strictly time-bounded and self-remove the moment the node
 *    leaves the DOM, so a toast that never "appears" can never spin the canvas.
 *  - Reduced motion renders nothing (no observer, no RAF); sonner's own
 *    entrance already respects the preference.
 *  - jsdom has no `getContext` — the effect no-ops cleanly there.
 */

const DURATION_MS = 720
const COUNT = 130
/** Share of embers tracing the plate's border (the rest dust its face). */
const EDGE_SHARE = 0.68

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

interface ForgeEmber {
  /** Perimeter fraction (edge embers) — resolved to xy against the live rect. */
  edge: boolean
  d01: number
  /** Face fractions (non-edge embers). */
  fx01: number
  fy01: number
  /** Scattered launch offset, expressed relative to the plate so it tracks. */
  ang: number
  spread: number
  seed: number
  r: number
  color: string
}

interface ForgeColors {
  cold: string
  ember: string
  hot: string
}

interface ForgePass {
  node: Element
  start: number
  embers: ForgeEmber[]
  colors: ForgeColors
}

function buildEmbers(colors: ForgeColors): ForgeEmber[] {
  const edgeCount = Math.floor(COUNT * EDGE_SHARE)
  return Array.from({ length: COUNT }, (_, i): ForgeEmber => {
    const edge = i < edgeCount
    const heat = Math.random()
    return {
      edge,
      d01: edge ? (i + Math.random()) / edgeCount : 0,
      fx01: Math.random(),
      fy01: Math.random(),
      ang: Math.random() * Math.PI * 2,
      spread: 0.5 + Math.random() * 0.7,
      seed: Math.random(),
      r: 0.7 + Math.random() * 1.4,
      color: heat < 0.22 ? colors.cold : heat < 0.82 ? colors.ember : colors.hot,
    }
  })
}

/** Resolve an ember's landing point against the plate's live rectangle. */
function targetOf(e: ForgeEmber, rect: DOMRect): { tx: number; ty: number } {
  if (!e.edge) {
    return { tx: rect.left + e.fx01 * rect.width, ty: rect.top + e.fy01 * rect.height }
  }
  const perimeter = 2 * (rect.width + rect.height)
  let d = e.d01 * perimeter
  if (d < rect.width) return { tx: rect.left + d, ty: rect.top }
  if (d < rect.width + rect.height) return { tx: rect.right, ty: rect.top + (d - rect.width) }
  if (d < rect.width * 2 + rect.height) {
    d -= rect.width + rect.height
    return { tx: rect.right - d, ty: rect.bottom }
  }
  d -= rect.width * 2 + rect.height
  return { tx: rect.left, ty: rect.bottom - d }
}

export function ToastForgeEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Rendered on first paint (SSR-safe, matches server); dropped from the DOM
  // by the effect below when the viewer prefers reduced motion.
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (typeof window === 'undefined') return

    // Reduced motion: no ember ceremony at all — drop the canvas entirely
    // (sonner's own entrance still runs and already respects the preference).
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setEnabled(false)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / unsupported — bail cleanly.

    let dpr = 1
    const sizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
    }
    sizeCanvas()

    const passes: ForgePass[] = []
    const seen = new WeakSet<Element>()
    let raf = 0

    const draw = (now: number) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, vw, vh)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = passes.length - 1; i >= 0; i -= 1) {
        const pass = passes[i]
        const t = (now - pass.start) / DURATION_MS
        if (t >= 1 || !pass.node.isConnected) {
          passes.splice(i, 1)
          continue
        }
        const rect = pass.node.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) continue
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const reach = Math.max(rect.width, rect.height)
        const dissolve = smoothstep(0.58, 0.98, t)

        for (const e of pass.embers) {
          const p = smoothstep(0, 1, Math.min(1, Math.max(0, t * 1.6 - e.seed * 0.42)))
          const flicker = 0.7 + 0.3 * Math.sin(now * 0.02 + e.seed * 40)
          const alpha = (0.28 + 0.72 * p) * (1 - dissolve) * flicker
          if (alpha <= 0.015) continue
          const { tx, ty } = targetOf(e, rect)
          const fx = cx + Math.cos(e.ang) * reach * e.spread
          const fy = cy + Math.sin(e.ang) * reach * e.spread * 0.8
          const x = fx + (tx - fx) * p
          const y = fy + (ty - fy) * p
          ctx.globalAlpha = Math.min(1, alpha)
          ctx.fillStyle = e.color
          ctx.beginPath()
          ctx.arc(x, y, e.r * (1 + (1 - p) * 0.8), 0, Math.PI * 2)
          ctx.fill()
          if (p > 0.85) {
            ctx.globalAlpha = Math.min(1, alpha * 0.9)
            ctx.fillStyle = pass.colors.hot
            ctx.beginPath()
            ctx.arc(x, y, e.r * 0.42, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      ctx.globalAlpha = 1
      if (passes.length > 0) {
        raf = requestAnimationFrame(draw)
      } else {
        raf = 0
        ctx.clearRect(0, 0, vw, vh)
      }
    }

    const ensureRunning = () => {
      if (raf === 0) raf = requestAnimationFrame(draw)
    }

    const forge = (node: Element) => {
      if (seen.has(node)) return
      seen.add(node)
      const colors: ForgeColors = {
        cold: readThemeCssColor('--color-heading', '#E7E4DF'),
        ember: readThemeCssColor('--color-highlight', '#c2703d'),
        hot: readThemeCssColor('--color-highlight-bright', '#e08a4a'),
      }
      passes.push({ node, start: performance.now(), embers: buildEmbers(colors), colors })
      ensureRunning()
    }

    const consider = (node: Node) => {
      if (!(node instanceof Element)) return
      if (node.matches('[data-sonner-toast]')) {
        forge(node)
        return
      }
      node.querySelectorAll?.('[data-sonner-toast]').forEach(forge)
    }

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach(consider)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // Catch any toast already mounted before this layer attached.
    document.querySelectorAll('[data-sonner-toast]').forEach(forge)

    const onResize = () => sizeCanvas()
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      if (raf !== 0) cancelAnimationFrame(raf)
    }
  }, [])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 999999999 }}
    />
  )
}
