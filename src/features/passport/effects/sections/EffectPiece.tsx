import { useEffect, useRef, useState, type RefObject } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { PassportEffectProps } from '../effectTypes'
import {
  containedRect,
  sampleSilhouette2D,
  type SilhouetteSample2D,
} from '../lib/silhouette2d'

/**
 * The Piece — "The Living Outline".
 *
 * The garment's own silhouette, traced in living light. The product photo
 * stays the subject; a continuous ribbon of champagne/bone embers circulates
 * its actual edge, moving tangentially with short fading trails — endless,
 * never stalling. On mount one bright runner sprints the full perimeter
 * (~1.2s) igniting the standing flow behind it — the outline draws itself
 * around the piece, then lives. Every ~7s a comet re-laps, and a soft pool
 * of light breathes under the hem.
 *
 * Shape accuracy: `../lib/silhouette2d` (the shared canvas-2D sampler — no
 * three.js, so opening The Piece never pulls `vendor-three`) alpha-gates a
 * small raster, Moore-traces the outer contour into an ordered loop, smooths
 * and evenly resamples it — all in IMAGE-box coordinates. The stage
 * `object-contain`s the photo in a 4:5 box, so every frame maps those
 * coordinates into the letterbox-aware contained rect (`containedRect`,
 * computed from the decoded natural aspect — the <img> lives outside this
 * subtree).
 *
 * No silhouette (null image, opaque photo, failed decode) → the same
 * particle language on a generic oval. Reduced motion → the outline held as
 * a complete drawn contour, no clock. Null 2D context → nothing.
 */

interface Rgb { r: number; g: number; b: number }
interface OutlineColors { champagne: Rgb; bone: Rgb }
const TAU = Math.PI * 2
/* Literal fallbacks mirror styles.css oath-dark so jsdom/SSR render sanely. */
const FALLBACK_COLORS: OutlineColors = {
  champagne: { r: 224, g: 138, b: 74 }, // --color-highlight-bright #e08a4a
  bone: { r: 231, g: 228, b: 223 }, // --color-line #E7E4DF
}

/** Parses #rgb/#rrggbb and rgb()/rgba() — the two forms our theme vars take. */
function parseColor(raw: string, fallback: Rgb): Rgb {
  const value = raw.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    const at = (i: number) => parseInt(h.slice(i, i + 2), 16)
    return { r: at(0), g: at(2), b: at(4) }
  }
  const fn = /^rgba?\(([^)]+)\)$/i.exec(value)
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).map(Number)
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite))
      return { r: parts[0], g: parts[1], b: parts[2] }
  }
  return fallback
}

function readOutlineColors(): OutlineColors {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: Rgb) => parseColor(style.getPropertyValue(name), fallback)
  return {
    champagne: read('--color-highlight-bright', FALLBACK_COLORS.champagne),
    bone: read('--color-line', FALLBACK_COLORS.bone),
  }
}

const rgba = (c: Rgb, a: number) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`
const mixRgb = (a: Rgb, b: Rgb, k: number): Rgb => ({
  r: Math.round(a.r + (b.r - a.r) * k),
  g: Math.round(a.g + (b.g - a.g) * k),
  b: Math.round(a.b + (b.b - a.b) * k),
})
const easeInOut = (x: number) => x * x * (3 - 2 * x)

/* One choreography clock (house standard) — every beat reads from here. */
const OUTLINE = {
  igniteS: 1.2, // the entrance runner's full-perimeter sprint
  pulseEvery: 7, // seconds between comet re-laps
  pulseS: 1.6, // one re-lap's duration
  lapS: 11, // a flow ember's base circulation period
  breathS: 5.6, // under-glow breath cycle
} as const
const LOOP_SAMPLES = 256 // even arc-length samples of the closed loop
const TRAIL = 4 // fading ghost dots behind each flow ember
const TRAIL_GAP = 0.006 // arc-length spacing between them
const COMET_SEGS = 12
const COMET_TAIL = 0.045 // the comet's tail length, in arc-length terms
const STILL_DOTS = 36

/** A closed loop in normalized image-box coords + the box's natural aspect. */
interface LoopPath {
  /** x,y pairs, 0..1 of the image box, even arc-length spacing. */
  pts: Float32Array
  aspect: number
}

/** Generic oval in a 4:5 field — the graceful stand-in when there is no edge. */
function ellipseLoop(): LoopPath {
  const pts = new Float32Array(LOOP_SAMPLES * 2)
  for (let i = 0; i < LOOP_SAMPLES; i += 1) {
    const a = (i / LOOP_SAMPLES) * TAU - Math.PI / 2
    pts[i * 2] = 0.5 + Math.cos(a) * 0.33
    pts[i * 2 + 1] = 0.52 + Math.sin(a) * 0.38
  }
  return { pts, aspect: 4 / 5 }
}

/** Shared-sampler outline → the flow engine's flat hot-path representation. */
function loopFromSample(sample: SilhouetteSample2D): LoopPath {
  const pts = new Float32Array(sample.outline.length * 2)
  for (let i = 0; i < sample.outline.length; i += 1) {
    pts[i * 2] = sample.outline[i].x
    pts[i * 2 + 1] = sample.outline[i].y
  }
  return { pts, aspect: sample.aspect }
}

/** The breathing under-glow as a unit gradient — shaped later by transform. */
function makeGlow(ctx: CanvasRenderingContext2D, champagne: Rgb): CanvasGradient {
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  glow.addColorStop(0, rgba(champagne, 0.3))
  glow.addColorStop(0.55, rgba(champagne, 0.1))
  glow.addColorStop(1, rgba(champagne, 0))
  return glow
}

export default function EffectPiece({ imageUrl, tier }: PassportEffectProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loop, setLoop] = useState<LoopPath | null>(null)

  // Resolve the loop: the real silhouette when the image yields one, the oval
  // otherwise. While a decode is in flight the stage simply waits, dark — the
  // entrance runner fires the moment the path exists.
  useEffect(() => {
    if (!imageUrl) {
      setLoop(ellipseLoop())
      return
    }
    let cancelled = false
    // The shared sampler resolves null on any failure — it never rejects.
    void sampleSilhouette2D(imageUrl, { outlinePoints: LOOP_SAMPLES }).then((sample) => {
      if (!cancelled) setLoop(sample ? loopFromSample(sample) : ellipseLoop())
    })
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  useStillOutline(reduced && loop ? loop : null, rootRef, canvasRef)
  useLivingOutline(!reduced && loop ? loop : null, tier, rootRef, canvasRef)

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      data-pp-piece={reduced ? 'outline-still' : 'outline'}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

/** Reduced motion: the outline held complete — drawn once, no clock at all. */
function useStillOutline(
  loop: LoopPath | null,
  rootRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!loop || !root || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // no 2D context: nothing, cleanly
    const colors = readOutlineColors()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const draw = () => {
      const rect = root.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (w < 2 || h < 2) return
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const { x: rx, y: ry, w: rw, h: rh } = containedRect(w, h, loop.aspect)
      ctx.save()
      ctx.translate(rx + rw / 2, ry + rh * 0.9)
      ctx.scale(rw * 0.52, rh * 0.16)
      ctx.globalAlpha = 0.18 // the pooled glow, held at a quiet fixed breath
      ctx.fillStyle = makeGlow(ctx, colors.champagne)
      ctx.fillRect(-1, -1, 2, 2)
      ctx.restore()
      ctx.globalAlpha = 1
      const p = loop.pts
      ctx.beginPath()
      ctx.moveTo(rx + p[0] * rw, ry + p[1] * rh)
      for (let i = 1; i < p.length / 2; i += 1) {
        ctx.lineTo(rx + p[i * 2] * rw, ry + p[i * 2 + 1] * rh)
      }
      ctx.closePath()
      ctx.strokeStyle = rgba(colors.champagne, 0.4)
      ctx.lineWidth = 1
      ctx.stroke()
      // Resting embers along the contour — the flow, paused mid-breath.
      const step = LOOP_SAMPLES / STILL_DOTS
      for (let i = 0; i < STILL_DOTS; i += 1) {
        const j = Math.floor(i * step)
        ctx.beginPath()
        ctx.arc(rx + p[j * 2] * rw, ry + p[j * 2 + 1] * rh, 1.1, 0, TAU)
        ctx.fillStyle = rgba(mixRgb(colors.champagne, colors.bone, (i % 3) * 0.25), 0.55)
        ctx.fill()
      }
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(root)
    return () => ro.disconnect()
  }, [loop, rootRef, canvasRef])
}

/** The living flow: circulation, entrance runner, comet re-laps, under-breath. */
function useLivingOutline(
  loop: LoopPath | null,
  tier: 'console' | 'sheet',
  rootRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!loop || !root || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // no 2D context: nothing, cleanly
    const colors = readOutlineColors()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const resize = () => {
      const rect = root.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(root)

    const count = tier === 'console' ? 90 : 45
    const embers = Array.from({ length: count }, (_, i) => ({
      s: i / count + ((Math.random() - 0.5) * 0.6) / count, // even + jitter
      v: (0.85 + Math.random() * 0.3) / OUTLINE.lapS, // laps/second
      r: 0.7 + Math.random() * 0.9,
      warm: Math.random() * 0.55, // champagne → bone blend per ember
      wobF: 1.8 + Math.random() * 2.6, // lateral drift + shimmer clock (rad/s)
      wobA: 0.8 + Math.random() * 1.4, // px of drift off the path
      ph: Math.random() * TAU,
    }))

    const M = loop.pts.length / 2
    // Contained rect of the image box inside the stage — refreshed per frame
    // so a stage resize re-registers the outline to the displayed pixels.
    let rx = 0, ry = 0, rw = 0, rh = 0
    // Scratch projection target — no per-frame allocation in the hot path.
    const pt = { x: 0, y: 0, nx: 0, ny: 0 }
    const project = (s: number) => {
      const f = (((s % 1) + 1) % 1) * M
      const i = f | 0
      const j = (i + 1) % M
      const fr = f - i
      const p = loop.pts
      pt.x = rx + (p[i * 2] + (p[j * 2] - p[i * 2]) * fr) * rw
      pt.y = ry + (p[i * 2 + 1] + (p[j * 2 + 1] - p[i * 2 + 1]) * fr) * rh
      const tx = (p[j * 2] - p[i * 2]) * rw // tangent in px space (aspect-true)
      const ty = (p[j * 2 + 1] - p[i * 2 + 1]) * rh
      const tl = Math.hypot(tx, ty) || 1
      pt.nx = -ty / tl
      pt.ny = tx / tl
    }
    const wrapDist = (a: number, b: number) => {
      const d = Math.abs(a - b) % 1
      return d > 0.5 ? 1 - d : d
    }
    const glow = makeGlow(ctx, colors.champagne)
    const hot = mixRgb(colors.champagne, colors.bone, 0.6)
    const comet = (s: number, strength: number) => {
      for (let k = COMET_SEGS; k >= 0; k -= 1) {
        const f = k / COMET_SEGS
        project(s - f * COMET_TAIL)
        const body = (1 - f) * (1 - f) // tail tapers, head burns
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 1 + body * 2.4, 0, TAU)
        ctx.fillStyle = rgba(hot, strength * (0.12 + 0.75 * body))
        ctx.fill()
      }
      ctx.beginPath() // the head's halo — pt still holds the head position
      ctx.arc(pt.x, pt.y, 7, 0, TAU)
      ctx.fillStyle = rgba(colors.champagne, strength * 0.22)
      ctx.fill()
    }

    let t = 0 // own clamped clock — a hidden tab resumes where it left off
    let raf = 0, running = false, last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (w < 2 || h < 2) return
      t += dt
      ;({ x: rx, y: ry, w: rw, h: rh } = containedRect(w, h, loop.aspect))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const ignite = Math.min(t / OUTLINE.igniteS, 1)
      // Under-breath: the pool below the hem, swelling on a slow cycle. The
      // unit gradient is shaped by the transform — zero per-frame allocation.
      ctx.save()
      ctx.translate(rx + rw / 2, ry + rh * 0.9)
      ctx.scale(rw * 0.52, rh * 0.16)
      ctx.globalAlpha = ignite * (0.16 + 0.07 * Math.sin((t * TAU) / OUTLINE.breathS))
      ctx.fillStyle = glow
      ctx.fillRect(-1, -1, 2, 2)
      ctx.restore()
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'lighter' // embers add up to real light
      // The entrance runner, then a recurring comet re-lap every pulseEvery.
      let cometS = -1
      if (t < OUTLINE.igniteS) {
        cometS = easeInOut(ignite)
        comet(cometS, 1)
      } else {
        const phase = (t - OUTLINE.igniteS) % OUTLINE.pulseEvery
        if (phase < OUTLINE.pulseS) {
          cometS = easeInOut(phase / OUTLINE.pulseS)
          comet(cometS, 0.85)
        }
      }
      // The standing flow — tangential circulation with short fading trails.
      const runnerS = easeInOut(ignite)
      for (const m of embers) {
        m.s += m.v * dt
        const sPos = ((m.s % 1) + 1) % 1
        // During the entrance, flow exists only where the runner has been.
        const lit =
          t >= OUTLINE.igniteS ? 1 : Math.min(1, Math.max(0, (runnerS - sPos) / 0.05 + 1))
        if (lit <= 0.01) continue
        const boost = cometS >= 0 ? Math.exp(-((wrapDist(sPos, cometS) / 0.05) ** 2)) : 0
        const shimmer = 0.75 + 0.25 * Math.sin(t * m.wobF + m.ph)
        const wob = Math.sin(t * m.wobF + m.ph) * m.wobA
        const col = mixRgb(colors.champagne, colors.bone, m.warm)
        for (let k = TRAIL; k >= 0; k -= 1) {
          project(sPos - k * TRAIL_GAP)
          const fade = 1 - k / (TRAIL + 1)
          ctx.beginPath()
          ctx.arc(
            pt.x + pt.nx * wob,
            pt.y + pt.ny * wob,
            m.r * (0.5 + 0.5 * fade) * (1 + boost * 0.6),
            0,
            TAU,
          )
          ctx.fillStyle = rgba(
            col,
            Math.min(1, lit * shimmer * (0.1 + 0.5 * fade * fade) * (1 + boost * 1.6)),
          )
          ctx.fill()
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    }
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    if (!document.hidden) start()
    return () => {
      stop()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [loop, tier, rootRef, canvasRef])
}
