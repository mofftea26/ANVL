import { useEffect, useRef, useState } from 'react'
import {
  buildEmbers,
  drawForgeFrame,
  projectEmber,
  resolveForgeRamp,
  type Ember,
  type ForgeRamp,
} from '@/shared/lib/forge/emberForge'

/**
 * The toast forge layer — every sonner toast materializes out of embers the
 * way the shared Modal does (see {@link ModalForgeEffect} + `.anvl-modal-forge`).
 * A single fixed, full-viewport canvas watches the DOM for freshly-mounted
 * `[data-sonner-toast]` plates; each new plate spawns an independent, short
 * ember pass built from the shared engine (`src/shared/lib/forge/emberForge.ts`)
 * — a swarm converges from a scattered ring onto the plate's live rectangle
 * (perimeter-biased so the forged edge draws in first), lands, and dissolves
 * as the plate settles. Scaled down from the modal: far fewer embers, ~0.7s,
 * and the plate is never held back (sonner owns its own entrance), so the
 * embers simply crown the arrival.
 *
 * This stays a hand-rolled multi-pass loop over one persistent canvas — not
 * a `ForgeEmberCanvas` per toast — because several toasts can be forging
 * concurrently on one shared, long-lived layer (`ForgeEmberCanvas` models a
 * single target's single pass, mounted only while it runs; the toaster is
 * mounted once for the app's life and must juggle N independent passes).
 * The motion maths itself (`buildEmbers`/`projectEmber`/`drawForgeFrame`) is
 * the exact same shared engine `ModalForgeEffect` draws from.
 *
 * Deliberately canvas-2D, not three.js — toasts live in the shared UI chunk
 * that both admin and storefront load. Keeping three.js out of the shared
 * path mirrors `ModalForgeEffect`'s rationale exactly (see `emberForge.ts`'s
 * header comment).
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

const COUNT = 130
/** Share of embers tracing the plate's border (the rest dust its face). */
const EDGE_SHARE = 0.68
const DURATION_MS = 720

interface ForgePass {
  node: Element
  start: number
  embers: Ember[]
  ramp: ForgeRamp
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

      for (let i = passes.length - 1; i >= 0; i -= 1) {
        const pass = passes[i]
        const t = (now - pass.start) / DURATION_MS
        if (t >= 1 || !pass.node.isConnected) {
          passes.splice(i, 1)
          continue
        }
        const rect = pass.node.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) continue
        // Re-resolve every ember's launch/landing point against the plate's
        // CURRENT rect so the swarm tracks sonner restacking it mid-pass.
        for (const ember of pass.embers) projectEmber(ember, rect)
        drawForgeFrame(ctx, pass.embers, { t, now, ramp: pass.ramp })
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
      const rect = node.getBoundingClientRect()
      const ramp = resolveForgeRamp()
      const embers = buildEmbers({ rect, ramp, count: COUNT, edgeShare: EDGE_SHARE })
      passes.push({ node, start: performance.now(), embers, ramp })
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
