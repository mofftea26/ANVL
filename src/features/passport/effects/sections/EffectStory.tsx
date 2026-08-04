import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { PassportEffectProps } from '../effectTypes'
import { containedRect, sampleSilhouette2D, type SilhouetteSample2D } from '../lib/silhouette2d'

/**
 * The Story — "Written on the Piece": the garment's own edge is the
 * manuscript line. A burning pen tip travels ~35% of the REAL silhouette
 * contour (from a shoulder — the outline's y-minima neighborhood); in its
 * wake the edge becomes a written line: a wavering champagne stroke with
 * Cinzel letterform fragments (A N V L O T H) standing on it like words on a
 * baseline, igniting as the pen passes. Letters breathe (alpha 0.5–0.8),
 * cool champagne → bone over ~8s; every ~9s the pen re-runs a DIFFERENT
 * segment, the old chapter fading as the new ignites — the chronicle keeps
 * being written on THIS piece. A few letterforms detach and drift upward —
 * sparks of text leaving the page — and an ink vignette breathes. The photo
 * stays the subject.
 *
 * This effect is the STORY's alone. `forge-notes` used to borrow it through a
 * `sectionKey` variant (letterless chalk marginalia) and inevitably read as a
 * weaker copy of the chronicle; it owns `EffectForgeNotes` (the revision
 * stack) since 2026-08-04, and the variant is gone.
 *
 * Shape: `../lib/silhouette2d` — NEVER `@/shared/webgl/particleShapes`, whose
 * top-level three.js import would drag `vendor-three` into this lazy chunk
 * (chunk hygiene, docs/animation-guidelines.md). The <img> is a SIBLING of
 * this layer — outline coords map through `containedRect` of the stage box.
 * Degradation: sample null (opaque photo, failed decode, jsdom) → the prior
 * bottom-rise glyph embers, the designed fallback; reduced motion → a STILL
 * (one written segment held complete), no clock; null 2D context → nothing.
 * Own clamped rAF clock; parks on hidden.
 */

/** Brand letterforms only — a vocabulary of fragments, never a readable word. */
const GLYPHS = 'ANVLOTH'

/** Literal fallbacks keep jsdom (and any var-less mount) on-brand. */
const COLOR_VARS = {
  ember: ['--color-highlight-bright', '#e08a4a'], bone: ['--color-heading', '#e7e4df'],
  graphite: ['--color-text-muted', '#bab8b3'], bg: ['--color-bg', '#0b0b0c'],
} as const

/** The choreography clock (ms) — every beat reads from here (house standard):
 *  the pen starts at `firstPass` (theme lands within ~2s) and writes for
 *  `write`; a new segment is re-run every `rewriteEvery` while the old
 *  chapter fades over `chapterFade`; letters cool over `cool`, breathe on
 *  `breathe`. */
const CLOCK = {
  firstPass: 250, write: 2000, rewriteEvery: 9000, chapterFade: 1800,
  cool: 8000, breathe: 3400, vignette: 8000,
} as const

const MAX_FRAME_MS = 64 // a hidden tab must not teleport the pen on resume
const FALLBACK_W = 416 // jsdom / unmeasured mounts report 0×0 — console 4:5
const FALLBACK_H = 520
const SEG_LEN = 0.35 // fraction of the perimeter one written pass covers
const STROKE_POINTS = 56 // polyline samples of a written segment
const TAU = Math.PI * 2

type Rgb = readonly [number, number, number]

function parseColor(raw: string, fallback: string): Rgb {
  const value = raw.trim() || fallback
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)?.[1]
  if (hex) {
    const n = parseInt(hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex, 16)
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  }
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(value)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return parseColor(fallback, fallback) // fallback literals are hex — terminates
}

type Palette = Record<keyof typeof COLOR_VARS, Rgb>

/** Read once at mount — the theme cannot change while a section is open. */
function readPalette(): Palette {
  const style = typeof window === 'undefined' ? null : getComputedStyle(document.documentElement)
  return Object.fromEntries(
    Object.entries(COLOR_VARS).map(([k, [v, fb]]) => [k, parseColor(style?.getPropertyValue(v) ?? '', fb)]),
  ) as Palette
}

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t,
]
const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(3)})`
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeInOut = (x: number) => x * x * (3 - 2 * x)
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
const pickGlyph = () => GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length))

/** The traced contour in normalized image-box coords + centroid + aspect. */
interface Shape { pts: Float32Array; cx: number; cy: number; aspect: number }
type ShapeState = Shape | 'pending' | null

function toShape(sample: SilhouetteSample2D): Shape {
  const pts = new Float32Array(sample.outline.length * 2)
  sample.outline.forEach((p, i) => { pts[i * 2] = p.x; pts[i * 2 + 1] = p.y })
  return { pts, cx: sample.centroid.x, cy: sample.centroid.y, aspect: sample.aspect }
}

/** Start writing at a shoulder: just past the outline's topmost point. */
function shoulderStart(pts: Float32Array): number {
  const n = pts.length / 2
  let best = 0
  for (let i = 1; i < n; i += 1) if (pts[i * 2 + 1] < pts[best * 2 + 1]) best = i
  return (best / n + 0.055) % 1
}

interface ProjPoint { x: number; y: number; tx: number; ty: number; nx: number; ny: number }

/** Arc-length projector: loop fraction → stage px + tangent + OUTWARD normal.
 *  `setBox` re-registers to the displayed contain-rect on every resize. */
function makeProjector(shape: Shape) {
  const pt: ProjPoint = { x: 0, y: 0, tx: 0, ty: 0, nx: 0, ny: 0 }
  let rx = 0, ry = 0, rw = 0, rh = 0, ccx = 0, ccy = 0
  const setBox = (w: number, h: number) => {
    ;({ x: rx, y: ry, w: rw, h: rh } = containedRect(w, h, shape.aspect))
    ccx = rx + shape.cx * rw; ccy = ry + shape.cy * rh
  }
  const span = () => Math.min(rw, rh)
  const proj = (s: number): ProjPoint => {
    const p = shape.pts, n = p.length / 2
    const f = (((s % 1) + 1) % 1) * n
    const i = f | 0, j = (i + 1) % n, fr = f - i
    pt.x = rx + (p[i * 2] + (p[j * 2] - p[i * 2]) * fr) * rw
    pt.y = ry + (p[i * 2 + 1] + (p[j * 2 + 1] - p[i * 2 + 1]) * fr) * rh
    const tx = (p[j * 2] - p[i * 2]) * rw, ty = (p[j * 2 + 1] - p[i * 2 + 1]) * rh
    const tl = Math.hypot(tx, ty) || 1
    pt.tx = tx / tl; pt.ty = ty / tl
    let nx = -pt.ty, ny = pt.tx
    if (nx * (pt.x - ccx) + ny * (pt.y - ccy) < 0) { nx = -nx; ny = -ny }
    pt.nx = nx; pt.ny = ny
    return pt
  }
  return { setBox, span, proj }
}
type Projector = ReturnType<typeof makeProjector>

/** Stands a glyph ON the contour, ascending along the outward normal
 *  (flipped when the tangent would print it into the garment). */
function letterAngle(pt: ProjPoint): number {
  const a = Math.atan2(pt.ty, pt.tx)
  return pt.ty * pt.nx - pt.tx * pt.ny < 0 ? a + Math.PI : a
}

/** One letterform standing on the written line; ignites as the pen passes. */
interface Letter { ch: string; u: number; size: number; phase: number; ignitedAt: number }
/** One pen pass over a contour segment + the letters it leaves standing. */
interface Chapter { start: number; len: number; born: number; fadeAt: number; waver: Float32Array; letters: Letter[] }

function buildChapter(born: number, start: number, sheet: boolean): Chapter {
  const amp = rand(1.1, 2.3), cyc = rand(3, 6) * TAU, ph = Math.random() * TAU
  // Sine waver + per-point grain, precomputed so the line does not boil.
  const waver = new Float32Array(STROKE_POINTS)
  for (let k = 0; k < STROKE_POINTS; k += 1)
    waver[k] = Math.sin((k / (STROKE_POINTS - 1)) * cyc + ph) * amp + rand(-0.35, 0.35)
  const count = sheet ? 5 : 8
  const letters = Array.from({ length: count }, (_, i) => ({
    ch: pickGlyph(), u: clamp01((i + 0.5) / count + rand(-0.25, 0.25) / count),
    size: sheet ? rand(12, 18) : rand(16, 25), phase: Math.random() * TAU, ignitedAt: -1,
  }))
  return { start, len: SEG_LEN * rand(0.9, 1.15), born, fadeAt: -1, waver, letters }
}

/** One rising letterform — a spark of text leaving the page. */
interface Spark {
  ch: string; x: number; y0: number; amp: number; phase: number; sway: number
  climb: number; rot: number; spin: number; size: number; born: number; life: number
}

function buildSpark(born: number, x: number, y0: number, climb: number, sheet: boolean): Spark {
  return {
    ch: pickGlyph(), x, y0, amp: rand(5, 13), phase: Math.random() * TAU,
    sway: rand(1, 2.4) * TAU, climb, rot: rand(-0.25, 0.25), spin: rand(-0.11, 0.11),
    size: sheet ? rand(13, 21) : rand(18, 30), born, life: rand(5000, 8000),
  }
}

/** Shared Cinzel painter — one atomic "stamp a glyph" op. Alphabetic baseline
 *  lets contour letters STAND on the line; sparks center on themselves. */
function paintGlyph(
  ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, rot: number,
  size: number, fill: string, baseline: CanvasTextBaseline = 'alphabetic',
) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
  ctx.font = `${size.toFixed(1)}px Cinzel, serif`
  ctx.textAlign = 'center'; ctx.textBaseline = baseline
  ctx.fillStyle = fill; ctx.fillText(ch, 0, 0); ctx.restore()
}

/** Stroke the first `count` scratch points as one written line. */
function strokeScratch(
  ctx: CanvasRenderingContext2D, xs: Float32Array, ys: Float32Array, count: number,
  width: number, style: string,
) {
  ctx.beginPath()
  ctx.moveTo(xs[0], ys[0])
  for (let k = 1; k < count; k += 1) ctx.lineTo(xs[k], ys[k])
  ctx.strokeStyle = style; ctx.lineWidth = width
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke()
}

/** The page's age: corners darken toward the theme bg, center stays clear. */
function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, bg: Rgb, a: number) {
  const r = Math.hypot(w, h) / 2
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.55, w / 2, h / 2, r)
  grad.addColorStop(0, rgba(bg, 0)); grad.addColorStop(1, rgba(bg, a))
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
}

/** One chapter: written stroke, standing letters, burning nib while writing.
 *  Returns false once fully faded — the caller prunes it. */
function drawChapter(
  ctx: CanvasRenderingContext2D, chap: Chapter, elapsed: number, P: Projector,
  pal: Palette, xs: Float32Array, ys: Float32Array,
): boolean {
  const fade = chap.fadeAt < 0 ? 1 : 1 - clamp01((elapsed - chap.fadeAt) / CLOCK.chapterFade)
  if (fade <= 0) return false
  const age = elapsed - chap.born
  const penU = age >= CLOCK.write ? 1 : easeInOut(clamp01(age / CLOCK.write))
  const count = Math.max(2, 1 + Math.round((STROKE_POINTS - 1) * penU))
  for (let k = 0; k < count; k += 1) {
    const pt = P.proj(chap.start + chap.len * (k / (STROKE_POINTS - 1)))
    xs[k] = pt.x + pt.nx * chap.waver[k]; ys[k] = pt.y + pt.ny * chap.waver[k]
  }
  strokeScratch(ctx, xs, ys, count, 1.5, rgba(mixRgb(pal.ember, pal.bone, clamp01(age / CLOCK.cool)), 0.55 * fade))
  for (const L of chap.letters) {
    if (L.ignitedAt < 0) {
      if (L.u > penU) continue
      L.ignitedAt = elapsed // the pen just crossed this letter's station
    }
    const la = elapsed - L.ignitedAt
    const breathe = 0.65 + 0.15 * Math.sin((la / CLOCK.breathe) * TAU + L.phase)
    const alpha = breathe * fade * Math.min(1, la / 240 + 0.35)
    const pt = P.proj(chap.start + chap.len * L.u)
    const rot = letterAngle(pt), lx = pt.x + pt.nx * 2, ly = pt.y + pt.ny * 2
    // Ignition flare: an oversized ember underlay while the letter is young.
    if (la < 340)
      paintGlyph(ctx, L.ch, lx, ly, rot, L.size * (1.5 - (la / 340) * 0.5), rgba(pal.ember, alpha * 0.4 * (1 - la / 340)))
    paintGlyph(ctx, L.ch, lx, ly, rot, L.size, rgba(mixRgb(pal.ember, pal.bone, clamp01(la / CLOCK.cool)), alpha))
  }
  if (penU < 1 && chap.fadeAt < 0) {
    // The burning nib — you SEE the writing happen on the edge itself.
    const pt = P.proj(chap.start + chap.len * penU)
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.6, 0, TAU); ctx.fillStyle = rgba(pal.ember, 0.9); ctx.fill()
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, TAU); ctx.fillStyle = rgba(pal.ember, 0.22); ctx.fill()
  }
  return true
}

/** A rising spark of text, cooling as it climbs. False once burnt out. */
function drawSpark(ctx: CanvasRenderingContext2D, sp: Spark, elapsed: number, pal: Palette): boolean {
  const age = elapsed - sp.born
  if (age >= sp.life) return false
  const p = age / sp.life
  const alpha = 0.7 * Math.min(1, p / 0.12) * (1 - p) ** 1.2
  if (alpha <= 0.008) return true
  const x = sp.x + Math.sin(p * sp.sway + sp.phase) * sp.amp, y = sp.y0 - p * sp.climb
  const col = mixRgb(pal.ember, pal.graphite, Math.min(1, p * 1.3))
  paintGlyph(ctx, sp.ch, x, y, sp.rot + sp.spin * (age / 1000), sp.size, rgba(col, alpha), 'middle')
  return true
}

export default function EffectStory({ imageUrl, tier }: PassportEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reducedMotion = useReducedMotion()
  const [shape, setShape] = useState<ShapeState>(() => (imageUrl ? 'pending' : null))

  useEffect(() => {
    if (!imageUrl) { setShape(null); return }
    let cancelled = false
    setShape('pending')
    // The shared sampler resolves null on ANY failure — the designed fallback.
    void sampleSilhouette2D(imageUrl).then((s) => void (cancelled || setShape(s ? toShape(s) : null)))
    return () => { cancelled = true }
  }, [imageUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || shape === 'pending') return // wait, dark, for real geometry
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / unsupported surface — the layer stays silent

    const pal = readPalette()
    const sheet = tier === 'sheet', contour = shape
    const P = contour ? makeProjector(contour) : null
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = FALLBACK_W, h = FALLBACK_H
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width >= 2 ? rect.width : FALLBACK_W
      h = rect.height >= 2 ? rect.height : FALLBACK_H
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      P?.setBox(w, h)
    }
    resize()
    const xs = new Float32Array(STROKE_POINTS), ys = new Float32Array(STROKE_POINTS)

    const drawStill = () => {
      // A STILL composition, not a paused animation: the chronicle at rest.
      ctx.clearRect(0, 0, w, h)
      drawVignette(ctx, w, h, pal.bg, 0.3)
      if (P && contour) {
        // One written contour segment, held complete and half-cooled.
        const start = shoulderStart(contour.pts)
        for (let k = 0; k < STROKE_POINTS; k += 1) {
          const pt = P.proj(start + SEG_LEN * (k / (STROKE_POINTS - 1)))
          xs[k] = pt.x; ys[k] = pt.y
        }
        const ink = mixRgb(pal.ember, pal.bone, 0.4)
        strokeScratch(ctx, xs, ys, STROKE_POINTS, 1.5, rgba(ink, 0.5))
        const rest = rgba(mixRgb(pal.ember, pal.bone, 0.55), 0.55)
        ;(['A', 'V', 'O'] as const).forEach((ch, i) => {
          const pt = P.proj(start + SEG_LEN * (0.22 + i * 0.28))
          paintGlyph(ctx, ch, pt.x + pt.nx * 2, pt.y + pt.ny * 2, letterAngle(pt), sheet ? 14 : 19, rest)
        })
        return
      }
      // Fallback still: three cooled letterforms, the ember field at rest.
      const rest = rgba(mixRgb(pal.ember, pal.graphite, 0.45), 0.5)
      const size = sheet ? 20 : 32
      paintGlyph(ctx, 'A', w * 0.26, h * 0.82, -0.12, size, rest, 'middle')
      paintGlyph(ctx, 'V', w * 0.5, h * 0.86, 0.06, size * 0.85, rest, 'middle')
      paintGlyph(ctx, 'O', w * 0.72, h * 0.8, 0.18, size, rest, 'middle')
    }

    const observer = new ResizeObserver(() => { resize(); if (reducedMotion) drawStill() })
    observer.observe(canvas)
    if (reducedMotion) {
      drawStill()
      return () => observer.disconnect()
    }

    // ——— The live engine ———
    const chapters: Chapter[] = []
    let nextChapterAt = CLOCK.firstPass
    let nextStart = contour ? shoulderStart(contour.pts) : 0

    // Detaching sparks (5 console / 3 sheet); the whole field in fallback.
    const sparkMax = contour ? (sheet ? 3 : 5) : sheet ? 5 : 8
    const sparks: Spark[] = []
    if (!contour)
      for (let i = 0; i < sparkMax; i += 1) {
        const sp = buildSpark(0, w * rand(0.06, 0.94), h * 1.04, h * rand(0.5, 0.65), sheet)
        sp.born = -rand(0.1, 0.75) * sp.life // the field opens mid-flow
        sparks.push(sp)
      }
    let nextSparkAt = CLOCK.firstPass + 700
    const fallbackSpark = () => buildSpark(elapsed, w * rand(0.06, 0.94), h * 1.04, h * rand(0.5, 0.65), sheet)
    const detachSpark = (): Spark | null => {
      // Sparks leave from the chapter being written — text off the fresh page.
      const active = chapters.find((ch) => ch.fadeAt < 0)
      if (!active || !P) return null
      const age = elapsed - active.born
      const penU = age >= CLOCK.write ? 1 : easeInOut(clamp01(age / CLOCK.write))
      const pt = P.proj(active.start + active.len * Math.random() * penU)
      return buildSpark(elapsed, pt.x, pt.y, h * rand(0.3, 0.42), sheet)
    }

    let elapsed = 0, last = performance.now(), raf = 0
    const frame = (now: number) => {
      // Clamp both ways: no rewind on a non-monotonic stamp, no forward leap.
      elapsed += Math.min(MAX_FRAME_MS, Math.max(0, now - last))
      last = now
      ctx.clearRect(0, 0, w, h)
      drawVignette(ctx, w, h, pal.bg, 0.26 + 0.1 * Math.sin((elapsed / CLOCK.vignette) * TAU))
      if (!P) {
        // Designed fallback: the bottom-rise glyph embers (the prior design).
        for (let i = 0; i < sparks.length; i += 1)
          if (!drawSpark(ctx, sparks[i], elapsed, pal)) {
            sparks[i] = fallbackSpark()
            drawSpark(ctx, sparks[i], elapsed, pal)
          }
      } else {
        if (elapsed >= nextChapterAt) {
          for (const ch of chapters) if (ch.fadeAt < 0) ch.fadeAt = elapsed
          chapters.push(buildChapter(elapsed, nextStart, sheet))
          nextStart = (nextStart + rand(0.41, 0.51)) % 1 // a DIFFERENT segment
          nextChapterAt = elapsed + CLOCK.rewriteEvery * rand(0.9, 1.1)
        }
        for (let i = chapters.length - 1; i >= 0; i -= 1)
          if (!drawChapter(ctx, chapters[i], elapsed, P, pal, xs, ys)) chapters.splice(i, 1)
        if (sparks.length < sparkMax && elapsed >= nextSparkAt) {
          const sp = detachSpark()
          if (sp) sparks.push(sp)
          nextSparkAt = elapsed + rand(1100, 1700)
        }
        for (let i = sparks.length - 1; i >= 0; i -= 1)
          if (!drawSpark(ctx, sparks[i], elapsed, pal)) {
            const sp = detachSpark()
            if (sp) sparks[i] = sp
            else sparks.splice(i, 1)
          }
      }
      raf = requestAnimationFrame(frame)
    }

    // Park outright while hidden (throttled rAF still burns battery); rebase
    // the clock on resume so the pause never reads as a fast-forward lurch.
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      observer.disconnect()
    }
  }, [shape, tier, reducedMotion])

  // Host layer is inert already; the data attrs let tests tell modes apart.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-motion={reducedMotion ? 'still' : 'live'}
      data-story-mode={shape === 'pending' ? 'resolving' : shape ? 'written' : 'embers'}
      className="absolute inset-0 h-full w-full"
    />
  )
}
