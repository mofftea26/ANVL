import { useEffect, useRef, useState, type RefObject } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { PassportEffectProps } from '../effectTypes'
import {
  containedRect,
  sampleSilhouette2D,
  type SilhouetteSample2D,
} from '../lib/silhouette2d'

/**
 * Material dossier — "The Reweave": the cloth of THIS garment, seen being
 * made. Weft strands span the piece's real width row by row (per-row
 * silhouette intercepts); warp strands run vertically, clipped to the
 * silhouette (empty rows, or exiting a row's edges, break the thread) — the
 * weave wraps the actual piece, never the stage. On mount the threads lace
 * in fast (~1.4s, staggered, champagne leaders on the drawing tips — an
 * event), then hold as a living lattice: perpetual slow shimmer, occasional
 * re-tension ripples traveling single strands, a diagonal sheen crossing the
 * cloth every ~7s (source-atop — light lands only on lattice pixels), lint
 * fibers drifting off the real outline. Alpha stays low-mid so the photo
 * reads through its new skin.
 *
 * Shape reads: `../lib/silhouette2d`. CHUNK HYGIENE: never import
 * `@/shared/webgl/particleShapes` or three.js here — that would drag
 * `vendor-three` into this lazy 2D chunk (docs/animation-guidelines.md,
 * "Passport section effects"). Degradation: sample null → the old
 * border-frame idea in miniature (a woven oval loom — designed, not broken).
 * Reduced motion → the completed lattice held static, no clock. Null 2D
 * context → nothing, cleanly. The rAF clock is the component's own, clamped,
 * parking on `document.hidden` and resuming without fast-forward.
 * (>300-line soft limit deliberately: the seam build confines the lattice
 * builders, the loom fallback and the live engine to this one file.)
 */

interface Rgb { r: number; g: number; b: number }
interface WeaveColors { champagne: Rgb; bone: Rgb; graphite: Rgb }
const TAU = Math.PI * 2
/* Literal fallbacks mirror styles.css oath-dark so jsdom/SSR render sanely. */
const FALLBACK_COLORS: WeaveColors = {
  champagne: { r: 224, g: 138, b: 74 }, // --color-highlight-bright #e08a4a
  bone: { r: 231, g: 228, b: 223 }, // --color-heading #E7E4DF
  graphite: { r: 186, g: 184, b: 179 }, // --color-text-muted #bab8b3
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

function readWeaveColors(): WeaveColors {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: Rgb) => parseColor(style.getPropertyValue(name), fallback)
  return {
    champagne: read('--color-highlight-bright', FALLBACK_COLORS.champagne),
    bone: read('--color-heading', FALLBACK_COLORS.bone),
    graphite: read('--color-text-muted', FALLBACK_COLORS.graphite),
  }
}

const rgba = (c: Rgb, a: number) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`
const mixRgb = (a: Rgb, b: Rgb, k: number): Rgb => ({
  r: Math.round(a.r + (b.r - a.r) * k),
  g: Math.round(a.g + (b.g - a.g) * k),
  b: Math.round(a.b + (b.b - a.b) * k),
})
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeInOut = (x: number) => x * x * (3 - 2 * x)
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3

/* One choreography clock (house standard) — every beat reads from here. */
const REWEAVE = {
  weaveS: 1.4, // the mount narrative: full lace-in window (stagger + draw)
  drawS: 0.7, // one strand's draw time within that window
  sheenDelay: 3, // a beat of stillness before light first travels the cloth
  sheenEvery: 7, sheenS: 2.2, // sheen crossings: cadence + duration
  rippleEvery: 2.6, rippleS: 0.9, // re-tension: mean pause + travel time
  fiberDelay: 1.6, // lint appears only once the cloth exists
} as const
/* Console = full budget; sheet ≈ half (per the section-effect standard). */
const COUNTS = {
  console: { weft: 24, warp: 14, fibers: 7, loops: 5, ticks: 26 },
  sheet: { weft: 12, warp: 7, fibers: 4, loops: 3, ticks: 13 },
} as const
const WEFT_PTS = 36 // samples along one weft strand
const LOOP_PTS = 88 // samples around one loom ring
const MIN_WARP_ROWS = 10 // a warp run shorter than this is noise, not thread

type Tier = PassportEffectProps['tier']

/** One strand, ordered from its lace-in end, in normalized image-box coords;
 *  `bright` 1 = bone weft (brighter tier), 0 = graphite warp (dimmer tier). */
interface Thread {
  pts: Float32Array; delay: number; alpha: number; bright: 0 | 1
  shimF: number; shimPh: number
}

interface Lattice {
  mode: 'reweave' | 'loom'; aspect: number; threads: Thread[]
  /** Fiber cradle: edge points (x,y pairs, normalized) lint is born on. */
  outline: Float32Array; cx: number; cy: number
}

interface Fiber {
  x: number; y: number; vx: number; vy: number; age: number; life: number
  len: number; bend: number; angle: number; spin: number; hot: boolean
}

interface Ripple { ti: number; at: number }

/** Deterministic PRNG — the same garment always reweaves the same cloth. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeThread(xy: number[], reversed: boolean, rand: () => number, bright: 0 | 1, alpha: number): Thread {
  const n = xy.length / 2
  const pts = new Float32Array(xy.length)
  for (let i = 0; i < n; i += 1) {
    const j = reversed ? n - 1 - i : i // alternate which edge threads enter from
    pts[i * 2] = xy[j * 2]
    pts[i * 2 + 1] = xy[j * 2 + 1]
  }
  return {
    pts, bright, alpha, delay: rand() * (REWEAVE.weaveS - REWEAVE.drawS),
    shimF: 0.5 + rand() * 1.1, shimPh: rand() * TAU,
  }
}

/* Two detuned sines — a single sine reads as a graph, the pair as thread. */
const wave = (c: number, amp: number, f: number, ph: number) =>
  amp * (Math.sin(c * f + ph) + 0.6 * Math.sin(c * f * 2.3 + ph * 1.7))

/** The real garment's lattice: weft spans each row's true width, warp is
 *  clipped to the silhouette — every contiguous visible run is its own thread. */
function buildGarmentLattice(sample: SilhouetteSample2D, tier: Tier): Lattice {
  const rand = mulberry32(0x7ea7e)
  const c = COUNTS[tier]
  const { rows, maskHeight: H } = sample
  let first = -1, last = -1, gL = 1, gR = 0
  for (let y = 0; y < H; y += 1) {
    const r = rows[y]
    if (!r) continue
    if (first < 0) first = y
    last = y
    gL = Math.min(gL, r.left)
    gR = Math.max(gR, r.right)
  }
  const threads: Thread[] = []
  for (let i = 0; i < c.weft; i += 1) {
    const t0 = Math.round(first + ((i + 0.5) / c.weft) * (last - first))
    let ry = -1 // nearest populated row to the even slot
    for (let d = 0; d < H && ry < 0; d += 1) {
      if (t0 - d >= first && rows[t0 - d]) ry = t0 - d
      else if (t0 + d <= last && rows[t0 + d]) ry = t0 + d
    }
    const row = ry >= 0 ? rows[ry] : null
    if (!row || row.right - row.left < 0.05) continue
    const y0 = (ry + 0.5) / H
    const [amp, f, ph] = [0.002 + rand() * 0.003, 9 + rand() * 8, rand() * TAU]
    const xy: number[] = []
    for (let j = 0; j < WEFT_PTS; j += 1) {
      const x = row.left + (j / (WEFT_PTS - 1)) * (row.right - row.left)
      xy.push(x, y0 + wave(x, amp, f, ph))
    }
    threads.push(makeThread(xy, i % 2 === 1, rand, 1, 0.2 + rand() * 0.1))
  }
  for (let i = 0; i < c.warp; i += 1) {
    const u = gL + ((i + 0.5) / c.warp) * (gR - gL) + (rand() - 0.5) * 0.012
    const [amp, f, ph] = [0.002 + rand() * 0.003, 9 + rand() * 8, rand() * TAU]
    let run: number[] = []
    const flush = () => {
      if (run.length >= MIN_WARP_ROWS * 2)
        threads.push(makeThread(run, i % 2 === 1, rand, 0, 0.13 + rand() * 0.08))
      run = []
    }
    for (let y = first; y <= last; y += 1) {
      const r = rows[y]
      if (r && u >= r.left && u <= r.right) {
        const ny = (y + 0.5) / H
        run.push(u + wave(ny, amp, f, ph), ny)
      } else flush()
    }
    flush()
  }
  const outline = new Float32Array(sample.outline.length * 2)
  for (let k = 0; k < sample.outline.length; k += 1) {
    outline[k * 2] = sample.outline[k].x
    outline[k * 2 + 1] = sample.outline[k].y
  }
  return { mode: 'reweave', aspect: sample.aspect, threads, outline, cx: sample.centroid.x, cy: sample.centroid.y }
}

/** No silhouette: the old border-frame idea in miniature — a woven oval loom
 *  (concentric ring strands + over-under cross ticks), same thread language. */
function buildLoom(tier: Tier): Lattice {
  const rand = mulberry32(0x100e)
  const c = COUNTS[tier]
  const [cx, cy, rx, ry] = [0.5, 0.52, 0.31, 0.36]
  const threads: Thread[] = []
  for (let k = 0; k < c.loops; k += 1) {
    const off = (k - (c.loops - 1) / 2) * 0.018
    const [wob, ph] = [0.004 + rand() * 0.004, rand() * TAU]
    const xy: number[] = []
    for (let j = 0; j <= LOOP_PTS; j += 1) {
      const a = (j / LOOP_PTS) * TAU
      const r = 1 + Math.sin(a * 3 + ph) * wob + Math.sin(a * 7 + ph * 2.1) * wob * 0.5
      xy.push(cx + Math.cos(a) * (rx + off) * r, cy + Math.sin(a) * (ry + off) * r)
    }
    threads.push(makeThread(xy, k % 2 === 1, rand, (k % 2) as 0 | 1, 0.16 + rand() * 0.08))
  }
  for (let i = 0; i < c.ticks; i += 1) {
    const a = (i / c.ticks) * TAU + 0.07
    const xy: number[] = []
    for (let j = 0; j <= 4; j += 1) {
      const s = -0.032 + (j / 4) * 0.064
      xy.push(cx + Math.cos(a) * (rx + s), cy + Math.sin(a) * (ry + s))
    }
    threads.push(makeThread(xy, i % 2 === 1, rand, 0, 0.14 + rand() * 0.06))
  }
  const outline = new Float32Array((LOOP_PTS + 1) * 2)
  for (let j = 0; j <= LOOP_PTS; j += 1) {
    const a = (j / LOOP_PTS) * TAU
    outline[j * 2] = cx + Math.cos(a) * rx
    outline[j * 2 + 1] = cy + Math.sin(a) * ry
  }
  return { mode: 'loom', aspect: 4 / 5, threads, outline, cx, cy }
}

export default function EffectMaterial({ imageUrl, tier }: PassportEffectProps) {
  const reduced = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lattice, setLattice] = useState<Lattice | null>(null)

  // The real garment's weave when the image yields a silhouette, the loom
  // otherwise; while a decode is in flight the stage waits, dark.
  useEffect(() => {
    if (!imageUrl) {
      setLattice(buildLoom(tier))
      return
    }
    let cancelled = false
    setLattice(null)
    // The shared sampler resolves null on any failure — it never rejects.
    void sampleSilhouette2D(imageUrl).then((sample) => {
      if (!cancelled) setLattice(sample ? buildGarmentLattice(sample, tier) : buildLoom(tier))
    })
    return () => {
      cancelled = true
    }
  }, [imageUrl, tier])

  useStillLattice(reduced && lattice ? lattice : null, canvasRef)
  useLivingLattice(!reduced && lattice ? lattice : null, tier, canvasRef)

  return (
    <canvas
      ref={canvasRef}
      data-pp-material={reduced ? 'still' : (lattice?.mode ?? 'pending')}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}

/** Reduced motion: the completed lattice held static — drawn once, no clock. */
function useStillLattice(lattice: Lattice | null, canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!lattice || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // no 2D context: nothing, cleanly
    const colors = readWeaveColors()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const [w, h] = [rect.width, rect.height]
      if (w < 2 || h < 2) return
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      ctx.lineWidth = 1
      const { x: rx, y: ry, w: rw, h: rh } = containedRect(w, h, lattice.aspect)
      for (const th of lattice.threads) {
        ctx.strokeStyle = rgba(th.bright ? colors.bone : colors.graphite, th.alpha)
        ctx.beginPath()
        ctx.moveTo(rx + th.pts[0] * rw, ry + th.pts[1] * rh)
        for (let j = 1; j < th.pts.length / 2; j += 1)
          ctx.lineTo(rx + th.pts[j * 2] * rw, ry + th.pts[j * 2 + 1] * rh)
        ctx.stroke()
      }
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [lattice, canvasRef])
}

/** The living cloth: lace-in, shimmer, re-tension ripples, sheen, lint. */
function useLivingLattice(
  lattice: Lattice | null,
  tier: Tier,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!lattice || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // no 2D context: nothing, cleanly
    const colors = readWeaveColors()
    const sheenTint = mixRgb(colors.bone, colors.champagne, 0.4)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const rand = mulberry32(tier === 'console' ? 0xf1be : 0x11f7)
    const fiberCount = COUNTS[tier].fibers
    const fibers: Fiber[] = []
    const ripples: Ripple[] = []
    let nextRippleAt = REWEAVE.weaveS + 1.1 // first re-tension after the lace-in

    const O = lattice.outline
    const oN = O.length / 2
    /** Lint is born ON an outline point and drifts away from the centroid. */
    const spawnFiber = (rx: number, ry: number, rw: number, rh: number): Fiber => {
      const i = (rand() * oN) | 0
      const x = rx + O[i * 2] * rw
      const y = ry + O[i * 2 + 1] * rh
      const dx = x - (rx + lattice.cx * rw)
      const dy = y - (ry + lattice.cy * rh)
      const dl = Math.hypot(dx, dy) || 1
      const sp = 4 + rand() * 8 // velocity: outward + a light upward draught
      return {
        x, y, vx: (dx / dl) * sp + (rand() - 0.5) * 3, vy: (dy / dl) * sp - (4 + rand() * 5),
        age: 0, life: 3.5 + rand() * 2.5, len: 7 + rand() * 9, bend: (rand() - 0.5) * 7,
        angle: rand() * TAU, spin: (rand() - 0.5) * 0.6,
        hot: rand() < 0.3, // the champagne glints among the lint
      }
    }

    const strokeSlice = (pts: Float32Array, i0: number, i1: number, rx: number, ry: number, rw: number, rh: number) => {
      ctx.beginPath()
      ctx.moveTo(rx + pts[i0 * 2] * rw, ry + pts[i0 * 2 + 1] * rh)
      for (let j = i0 + 1; j <= i1; j += 1) ctx.lineTo(rx + pts[j * 2] * rw, ry + pts[j * 2 + 1] * rh)
      ctx.stroke()
    }

    let t = 0 // own clamped clock — a hidden tab resumes where it left off
    let raf = 0, running = false, last: number | null = null
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (last === null) last = now // first frame (and resume) contributes dt 0
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05)
      last = now
      if (w < 2 || h < 2) return
      t += dt
      const { x: rx, y: ry, w: rw, h: rh } = containedRect(w, h, lattice.aspect)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'

      // 1 — the lattice: staggered lace-in with champagne leaders, then the
      // perpetual per-thread shimmer.
      for (const th of lattice.threads) {
        const n = th.pts.length / 2
        const p = easeOutCubic(clamp01((t - th.delay) / REWEAVE.drawS))
        if (p <= 0) continue
        const count = Math.max(1, Math.round(p * (n - 1)))
        const shimmer = 0.8 + 0.2 * Math.sin(t * th.shimF + th.shimPh)
        ctx.lineWidth = 1
        ctx.strokeStyle = rgba(th.bright ? colors.bone : colors.graphite, th.alpha * shimmer)
        strokeSlice(th.pts, 0, count, rx, ry, rw, rh)
        if (p < 1 && count > 2) {
          ctx.lineWidth = 1.4
          ctx.strokeStyle = rgba(colors.champagne, 0.85)
          strokeSlice(th.pts, Math.max(0, count - 3), count, rx, ry, rw, rh)
        }
      }

      // 2 — re-tension: one strand snaps taut, a bright ripple traveling it.
      if (t >= nextRippleAt && lattice.threads.length > 0) {
        ripples.push({ ti: (rand() * lattice.threads.length) | 0, at: t })
        nextRippleAt = t + REWEAVE.rippleEvery * (0.6 + rand() * 0.8)
      }
      for (let k = ripples.length - 1; k >= 0; k -= 1) {
        const rp = ripples[k]
        const f = (t - rp.at) / REWEAVE.rippleS
        const th = lattice.threads[rp.ti]
        if (f >= 1 || !th) {
          ripples.splice(k, 1)
          continue
        }
        const n = th.pts.length / 2
        const head = Math.min(n - 1, Math.max(1, Math.round(clamp01(easeInOut(f) * 1.12) * (n - 1))))
        const tail = Math.max(0, head - Math.max(2, Math.round(n * 0.14)))
        ctx.lineWidth = 1.3
        ctx.strokeStyle = rgba(colors.champagne, Math.sin(Math.PI * f) * 0.7)
        strokeSlice(th.pts, tail, head, rx, ry, rw, rh)
      }

      // 3 — the sheen: a diagonal light band; source-atop lands it ONLY on
      // painted lattice pixels, never washing the photo beneath.
      if (t >= REWEAVE.sheenDelay) {
        const local = (t - REWEAVE.sheenDelay) % REWEAVE.sheenEvery
        if (local < REWEAVE.sheenS) {
          const [dx, dy] = [0.86, 0.51] // ~30° — light tracking across laid cloth
          const span = w * dx + h * dy
          const half = span * 0.18
          const center = -half + (local / REWEAVE.sheenS) * (span + half * 2)
          const g = ctx.createLinearGradient(0, 0, dx * span, dy * span)
          g.addColorStop(clamp01((center - half) / span), 'rgba(0, 0, 0, 0)')
          g.addColorStop(clamp01(center / span), rgba(sheenTint, 0.6))
          g.addColorStop(clamp01((center + half) / span), 'rgba(0, 0, 0, 0)')
          ctx.save()
          ctx.globalCompositeOperation = 'source-atop'
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)
          ctx.restore()
        }
      }

      // 4 — loose fibers: lint born on the real outline, drifting away, fading.
      if (t >= REWEAVE.fiberDelay) {
        while (fibers.length < fiberCount) fibers.push(spawnFiber(rx, ry, rw, rh))
        for (const fb of fibers) {
          fb.age += dt
          if (fb.age >= fb.life) {
            Object.assign(fb, spawnFiber(rx, ry, rw, rh))
            continue
          }
          fb.x += fb.vx * dt
          fb.y += fb.vy * dt
          fb.angle += fb.spin * dt
          const env = Math.sin(Math.PI * (fb.age / fb.life)) // fade in, fade out
          ctx.save()
          ctx.translate(fb.x, fb.y)
          ctx.rotate(fb.angle)
          ctx.globalAlpha = env * (fb.hot ? 0.5 : 0.24)
          ctx.strokeStyle = rgba(fb.hot ? colors.champagne : colors.bone, 1)
          ctx.lineWidth = fb.hot ? 1.3 : 1
          ctx.beginPath()
          ctx.moveTo(-fb.len / 2, 0)
          ctx.quadraticCurveTo(0, fb.bend, fb.len / 2, 0)
          ctx.stroke()
          ctx.restore()
        }
        ctx.globalAlpha = 1
      }
    }
    const start = () => {
      if (running) return
      running = true
      last = null // resume in place — never fast-forward the hidden span
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
  }, [lattice, tier, canvasRef])
}
