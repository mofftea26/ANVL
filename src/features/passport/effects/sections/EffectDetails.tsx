import { useEffect, useRef, useState, type RefObject } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { mix, withAlpha } from '@/shared/lib/color'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import { resolveForgeRamp, type ForgeRamp } from '@/shared/lib/forge/emberForge'
import { FORGE_MAX_DPR } from '@/shared/lib/forge/forgeSurface'
import type { PassportEffectProps } from '../effectTypes'
import { containedRect, sampleSilhouette2D, type SilhouetteRow, type SilhouetteSample2D } from '../lib/silhouette2d'

/**
 * Forged details — "Still Cooling". The piece has just left the anvil and the
 * heat is IN it: the silhouette sheds contour embers born ON the real outline
 * (hem-weighted) that glow on the edge, detach and drift upward-outward,
 * cooling champagne → graphite; mask-clipped heat patches seated on real rows
 * breathe in the lower third; on mount the quench line sweeps DOWN the
 * garment once (~1.4s) — rows above settle, rows below still flare, and
 * steam-white flashes fire on each passed row's actual left/right intercepts;
 * every ~7s a spark burst pops from an outline point that still had heat in
 * it. Continuous life — the fire belongs to THIS piece.
 *
 * Geometry: `../lib/silhouette2d` (the shared canvas-2D sampler — NO three.js,
 * per the chunk-hygiene rule in docs/animation-guidelines.md, "Passport
 * section effects"), mapped per frame through `containedRect` of the stage
 * box (the <img> is a sibling of this layer). Draw vocabulary is the house
 * ember engine's (`resolveForgeRamp`, `FORGE_MAX_DPR`, additive `arc`+`fill`,
 * fillStyle written only on change, fixed pools). Degradation: sample null →
 * the hearth, a designed bottom-edge updraft (the previous Details in
 * spirit); reduced motion → a STILL (glow held + resting embers on the
 * outline, no clock); null 2D context → nothing, cleanly. Over the 300-line
 * soft limit deliberately (EffectSpecs' dispensation): the seam confines
 * shape build, both regimes and choreography to this one lazy file.
 */

const TAU = Math.PI * 2
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => { const c = clamp01(x); return c * c * (3 - 2 * c) }
const easeOut = (x: number) => 1 - (1 - x) ** 2

/* One choreography clock (house standard) — every beat reads from here. */
const COOLING = {
  quenchAtS: 0.35, // the front starts sweeping shortly after the shape lands
  quenchS: 1.4, // one top→bottom pass — the mount narrative
  breathS: 6.4, // internal-heat swell/relax cycle
  popMinGapS: 6.2, popRangeS: 2.4, // spark events every ~7s
  popAfterQuenchS: 1.8, // first pop clears the quench beat
  hearthIgniteS: 1.1, // fallback mode's coal-pool fade-in
} as const
/** ~45 live contour embers on the console, ~20 on the sheet (per the brief). */
const EMBER_COUNT: Record<PassportEffectProps['tier'], number> = { console: 45, sheet: 20 }
const PATCH_COUNT: Record<PassportEffectProps['tier'], number> = { console: 3, sheet: 2 }
const SPARK_SLOTS = 12
const ATTACH_FRAC = 0.24 // first stretch of an ember's life: glowing ON the edge
const STILL_EMBERS = 14
const COOLING_STEPS = 7 // hot → ember → graphite stops, pre-mixed at mount
const EDGE_TRAIL_ROWS = 7 // steam flashes linger this many rows behind the front
const MAX_DT_S = 0.064 // dt clamp — a throttled tab can never teleport an ember
const ALPHA_FLOOR = 0.015 // engine's cull floor

/* born < 0 = backdated mid-life at mount. drift/rise are fractions of the
   displayed image height (garment) or the stage-height climb (hearth); sway
   is px; idx is the outline birth index; x01 the hearth's bottom lane. */
interface ContourEmber { idx: number; x01: number; born: number; life: number; drift: number; rise: number; sway: number; phase: number; r: number }
interface Spark { free: boolean; born: number; life: number; x: number; y: number; vx: number; vy: number; r: number }
/** Seated on a real silhouette row; `r` = fraction of displayed image height. */
interface HeatPatch { x: number; y: number; r: number; phase: number }
interface GarmentShape {
  kind: 'garment'
  pts: Float32Array // closed outline, x,y pairs, normalized image-box coords
  normals: Float32Array // outward unit normals, aspect-corrected (≡ px dirs)
  spawn: Uint16Array // birth table — every point once, lower half three times
  rows: ReadonlyArray<SilhouetteRow | null>
  rowCount: number
  top: number; bottom: number // first/last populated row centers (0..1 of image h)
  aspect: number
  patches: HeatPatch[]
}
interface HearthShape { kind: 'hearth' }
type CoolingShape = GarmentShape | HearthShape
const HEARTH: HearthShape = { kind: 'hearth' }

/** Nearest populated row to `target` (clamped) — patch seats never miss. */
function nearestRow(rows: ReadonlyArray<SilhouetteRow | null>, target: number): number {
  const t = Math.min(rows.length - 1, Math.max(0, target))
  for (let d = 0; d < rows.length; d += 1) {
    if (t - d >= 0 && rows[t - d]) return t - d
    if (t + d < rows.length && rows[t + d]) return t + d
  }
  return t
}

function buildGarmentShape(sample: SilhouetteSample2D): GarmentShape {
  const n = sample.outline.length
  const a = sample.aspect
  const pts = new Float32Array(n * 2)
  sample.outline.forEach((pt, i) => { pts[i * 2] = pt.x; pts[i * 2 + 1] = pt.y })
  /* Outward unit normals in aspect-corrected space — containedRect preserves
     the image aspect (rw = rh·aspect), so these are unit px directions too.
     Winding is settled by a centroid majority vote: robust to either trace
     direction and to concave stretches a per-point test would misjudge. */
  const normals = new Float32Array(n * 2)
  let vote = 0
  for (let i = 0; i < n; i += 1) {
    const [p, q] = [(i - 1 + n) % n, (i + 1) % n]
    const [tx, ty] = [(pts[q * 2] - pts[p * 2]) * a, pts[q * 2 + 1] - pts[p * 2 + 1]]
    const l = Math.hypot(tx, ty) || 1
    normals[i * 2] = -ty / l
    normals[i * 2 + 1] = tx / l
    vote += (normals[i * 2] * (pts[i * 2] - sample.centroid.x)) * a + normals[i * 2 + 1] * (pts[i * 2 + 1] - sample.centroid.y)
  }
  if (vote < 0) for (let i = 0; i < normals.length; i += 1) normals[i] = -normals[i]
  /* Birth table: hem and lower seams shed most of the heat (lower half 3×). */
  const spawnList: number[] = []
  for (let i = 0; i < n; i += 1) spawnList.push(...(pts[i * 2 + 1] > sample.centroid.y ? [i, i, i] : [i]))
  let [first, last] = [-1, -1]
  sample.rows.forEach((row, y) => { if (row) { last = y; if (first < 0) first = y } })
  const rowCount = sample.maskHeight
  const top = (Math.max(first, 0) + 0.5) / rowCount
  const bottom = (Math.max(last, 0) + 0.5) / rowCount
  /* Heat patches seated on REAL rows in the lower third, sized by that row's
     actual width — the glow is registered to this piece, not a floor light. */
  const span = Math.max(bottom - top, 0.001)
  const seats = [{ fy: 0.9, k: 0.4 }, { fy: 0.72, k: 0.62 }, { fy: 0.82, k: 0.5 }]
  const patches = seats.map((seat, i): HeatPatch => {
    const row = nearestRow(sample.rows, Math.round((top + seat.fy * span) * rowCount - 0.5))
    const edge = sample.rows[row]
    const x = edge ? edge.left + seat.k * (edge.right - edge.left) : sample.centroid.x
    const width = edge ? (edge.right - edge.left) * a : 0.4
    return { x, y: (row + 0.5) / rowCount, r: Math.min(0.26, Math.max(0.09, width * 0.32)), phase: i * 2.4 }
  })
  const spawn = Uint16Array.from(spawnList)
  return { kind: 'garment', pts, normals, spawn, rows: sample.rows, rowCount, top, bottom, aspect: a, patches }
}

interface CoolingColors { stops: string[]; hot: string; ember: string; steam: string; flash: string }

/** Hot → ember → graphite stops, pre-mixed so the loop only indexes strings. */
function buildCoolingStops(ramp: ForgeRamp, graphite: string): string[] {
  const stops = Array.from({ length: COOLING_STEPS }, (_, i) => {
    const t = i / (COOLING_STEPS - 1)
    return t < 0.5 ? mix(ramp.hot, ramp.ember, t * 2) : mix(ramp.ember, graphite, (t - 0.5) * 2)
  })
  stops[0] = mix(ramp.hot, '#ffffff', 0.35) // white-hot at birth
  return stops
}

/** Theme tokens once per mount, the engine's way; graphite sinks toward the
 *  room's bg so a dying ember disappears *into* the stage, never onto it. */
function readCoolingColors(): CoolingColors {
  const ramp = resolveForgeRamp()
  const muted = readThemeCssColor('--color-text-muted', '#bab8b3')
  const graphite = mix(muted, readThemeCssColor('--color-bg', '#0b0b0c'), 0.55)
  return {
    stops: buildCoolingStops(ramp, graphite),
    hot: ramp.hot, ember: ramp.ember,
    steam: mix(ramp.cold, '#ffffff', 0.55), flash: mix(ramp.hot, '#ffffff', 0.55),
  }
}

/* Unit gradients, shaped later by transform — zero per-frame allocation. */
const grad = (g: CanvasGradient, stops: ReadonlyArray<readonly [number, string]>) => {
  for (const [offset, color] of stops) g.addColorStop(offset, color)
  return g
}
const makeHeatGlow = (ctx: CanvasRenderingContext2D, c: CoolingColors) =>
  grad(ctx.createRadialGradient(0, 0, 0, 0, 0, 1), [[0, withAlpha(c.hot, 0.55)], [0.45, withAlpha(c.ember, 0.22)], [1, withAlpha(c.ember, 0)]])
const makeQuenchBand = (ctx: CanvasRenderingContext2D, c: CoolingColors) =>
  grad(ctx.createLinearGradient(0, -1, 0, 1), [[0, withAlpha(c.steam, 0)], [0.5, withAlpha(c.steam, 0.7)], [1, withAlpha(c.steam, 0)]])

/** The silhouette as a canvas path in stage px — the internal-heat clip. */
function tracePath(ctx: CanvasRenderingContext2D, pts: Float32Array, rx: number, ry: number, rw: number, rh: number): void {
  ctx.beginPath()
  ctx.moveTo(rx + pts[0] * rw, ry + pts[1] * rh)
  for (let i = 1; i < pts.length / 2; i += 1) ctx.lineTo(rx + pts[i * 2] * rw, ry + pts[i * 2 + 1] * rh)
  ctx.closePath()
}

/** Stamp a unit gradient through a transform — the one glow/band draw idiom. */
function unitFill(ctx: CanvasRenderingContext2D, g: CanvasGradient, cx: number, cy: number, sx: number, sy: number, alpha: number): void {
  ctx.save()
  ctx.translate(cx, cy); ctx.scale(sx, sy)
  ctx.globalAlpha = Math.min(1, alpha); ctx.fillStyle = g
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()
}

export default function EffectDetails({ imageUrl, tier }: PassportEffectProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Null while a decode is in flight — the stage waits dark, and the quench
  // narrative fires the moment the real shape exists (EffectPiece's pattern).
  const [shape, setShape] = useState<CoolingShape | null>(imageUrl ? null : HEARTH)

  useEffect(() => {
    if (!imageUrl) return void setShape(HEARTH)
    let cancelled = false
    // The shared sampler resolves null on any failure — it never rejects.
    void sampleSilhouette2D(imageUrl).then((s) => void (cancelled || setShape(s ? buildGarmentShape(s) : HEARTH)))
    return () => void (cancelled = true)
  }, [imageUrl])

  useCoolingCanvas(shape, tier, reduced, rootRef, canvasRef)

  return (
    <div
      ref={rootRef}
      data-passport-effect="details"
      data-pp-details={reduced ? 'cooling-still' : 'cooling'}
      data-details-shape={shape?.kind ?? 'pending'}
      className="absolute inset-0"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
    </div>
  )
}

/** One canvas engine, two regimes. Reduced motion ⇒ the STILL: glow held +
 *  resting embers on the real outline, drawn once (plus resize redraws), no
 *  clock. Otherwise the live composition: shedding contour embers, breathing
 *  internal heat, the one-shot quench front, periodic spark events. */
function useCoolingCanvas(
  shape: CoolingShape | null,
  tier: PassportEffectProps['tier'],
  reduced: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!shape || !root || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // no 2D context: nothing, cleanly
    const colors = readCoolingColors()
    const glow = makeHeatGlow(ctx, colors)
    const dpr = Math.min(window.devicePixelRatio || 1, FORGE_MAX_DPR)
    const garment = shape.kind === 'garment' ? shape : null
    const sizeTo = (w: number, h: number) => {
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    if (reduced) {
      const drawStill = () => {
        const rect = root.getBoundingClientRect()
        const [w, h] = [rect.width, rect.height]
        if (w < 2 || h < 2) return
        sizeTo(w, h)
        ctx.clearRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'lighter'
        const dot = (x: number, y: number, i: number) => {
          ctx.fillStyle = colors.stops[1 + (i % 3)]
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, TAU); ctx.fill()
        }
        if (garment) {
          const { x: rx, y: ry, w: rw, h: rh } = containedRect(w, h, garment.aspect)
          const span = Math.max(garment.bottom - garment.top, 0.001)
          ctx.save()
          tracePath(ctx, garment.pts, rx, ry, rw, rh)
          ctx.clip()
          for (const p of garment.patches) {
            const vs = clamp01((p.y - garment.top) / span) // bottom rows hold heat
            unitFill(ctx, glow, rx + p.x * rw, ry + p.y * rh, p.r * rh * 1.5, p.r * rh, (0.4 + 0.6 * vs * vs) * 0.4)
          }
          ctx.restore()
          // Resting embers on the contour, hem-weighted — the shedding, paused.
          ctx.globalAlpha = 0.55
          for (let i = 0; i < STILL_EMBERS; i += 1) {
            const idx = garment.spawn[Math.floor((i * garment.spawn.length) / STILL_EMBERS)]
            dot(rx + garment.pts[idx * 2] * rw, ry + garment.pts[idx * 2 + 1] * rh, i)
          }
        } else {
          // Coal pool at a readable fixed breath + resting embers on the
          // bottom edge (golden-ratio scatter — stable across redraws).
          unitFill(ctx, glow, w / 2, h * 1.02, w * 0.62, h * 0.24, 0.34)
          ctx.globalAlpha = 0.5
          for (let i = 0; i < STILL_EMBERS; i += 1) dot(w * (0.06 + ((i * 0.618034) % 1) * 0.88), h - 2 - (i % 4), i)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }
      drawStill()
      const ro = new ResizeObserver(drawStill)
      ro.observe(root)
      return () => ro.disconnect()
    }

    const band = makeQuenchBand(ctx, colors)
    let [w, h] = [0, 0]
    const measure = () => {
      const rect = root.getBoundingClientRect()
      ;[w, h] = [rect.width, rect.height]
      sizeTo(w, h)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    // Contained rect of the image inside the stage — refreshed per frame so a
    // resize re-registers everything to the displayed pixels.
    let [rx, ry, rw, rh] = [0, 0, 0, 0]

    const gSpan = garment ? Math.max(garment.bottom - garment.top, 0.001) : 1
    const vsOf = (v01: number) => (garment ? clamp01((v01 - garment.top) / gSpan) : 0)
    /** The quench as a heat field: rows above the front settle to embered calm
     *  (bottom rows hold heat longest), rows below still flare; after the
     *  pass, the settled gradient. */
    const heatAt = (v01: number, clock: number) => {
      if (!garment) return 1
      const q = (clock - COOLING.quenchAtS) / COOLING.quenchS
      if (q <= 0) return 1.1 // fresh off the anvil — everything flares
      const base = 0.4 + 0.6 * vsOf(v01) ** 2
      if (q >= 1) return base
      return base + (1.1 - base) * smooth((vsOf(v01) - (smooth(q) - 0.1)) / 0.12)
    }

    // Fixed pools, engine idiom — nothing is allocated after this point.
    const respawn = (e: ContourEmber, clock: number) => {
      e.born = clock; e.life = 3.2 + Math.random() * 2.6
      e.r = 0.8 + Math.random() * 1.5; e.sway = 2 + Math.random() * 5
      e.phase = Math.random() * TAU; e.drift = 0.05 + Math.random() * 0.11
      e.rise = garment ? 0.05 + Math.random() * 0.1 : 0.16 + Math.random() * 0.3
      e.idx = garment ? garment.spawn[(Math.random() * garment.spawn.length) | 0] : 0
      e.x01 = 0.06 + Math.random() * 0.88
    }
    const embers: ContourEmber[] = []
    for (let i = 0; i < EMBER_COUNT[tier]; i += 1) {
      const e: ContourEmber = { idx: 0, x01: 0, born: 0, life: 1, drift: 0, rise: 0, sway: 0, phase: 0, r: 1 }
      respawn(e, 0)
      e.born = -Math.random() * e.life // backdate: alive mid-cycle at mount
      embers.push(e)
    }
    const sparks: Spark[] = Array.from({ length: SPARK_SLOTS }, (): Spark => ({ free: true, born: 0, life: 1, x: 0, y: 0, vx: 0, vy: 0, r: 1 }))
    let nextPopAt = garment ? COOLING.quenchAtS + COOLING.quenchS + COOLING.popAfterQuenchS : 0.6

    /** A burst from an outline point that still had heat in it. */
    const spawnPop = (clock: number) => {
      let [ox, oy, nx, ny] = [0, 0, 0, -1]
      if (garment) {
        const i = garment.spawn[(Math.random() * garment.spawn.length) | 0]
        ;[ox, oy] = [rx + garment.pts[i * 2] * rw, ry + garment.pts[i * 2 + 1] * rh]
        ;[nx, ny] = [garment.normals[i * 2], garment.normals[i * 2 + 1]]
      } else {
        ;[ox, oy] = [w * (0.1 + Math.random() * 0.8), h - 2]
      }
      let wanted = (tier === 'console' ? 9 : 6) + Math.floor(Math.random() * 3)
      for (const s of sparks) {
        if (wanted <= 0) break
        if (!s.free) continue
        s.free = false
        s.born = clock; s.life = 0.5 + Math.random() * 0.35
        s.x = ox + (Math.random() - 0.5) * 6; s.y = oy + (Math.random() - 0.5) * 6
        const [angle, speed] = [Math.atan2(ny, nx) + (Math.random() - 0.5) * 1.3, 50 + Math.random() * 90]
        s.vx = Math.cos(angle) * speed
        s.vy = Math.sin(angle) * speed - (30 + Math.random() * 50) // buoyant
        s.r = 0.9 + Math.random() * 1.0; wanted -= 1
      }
    }

    const draw = (clock: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (w < 2 || h < 2) return
      const q = garment ? (clock - COOLING.quenchAtS) / COOLING.quenchS : 2
      if (garment) ({ x: rx, y: ry, w: rw, h: rh } = containedRect(w, h, garment.aspect))

      // 1 — internal heat, clipped to the real silhouette (hearth: coal pool).
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      if (garment) {
        tracePath(ctx, garment.pts, rx, ry, rw, rh)
        ctx.clip()
        const breath = (clock * TAU) / COOLING.breathS
        for (let i = 0; i < PATCH_COUNT[tier]; i += 1) {
          const p = garment.patches[i]
          if (!p) continue
          const swell = 1 + 0.14 * Math.sin(breath + p.phase)
          const alpha = heatAt(p.y, clock) * (0.4 + 0.14 * Math.sin(breath + p.phase + 1.1))
          unitFill(ctx, glow, rx + p.x * rw, ry + p.y * rh, p.r * rh * swell * 1.5, p.r * rh * swell, alpha)
        }
        if (q > 0 && q < 1) {
          // The cooling front itself — a steam line crossing the garment only.
          const frontY = ry + (garment.top + smooth(q) * (garment.bottom - garment.top)) * rh
          unitFill(ctx, band, rx + rw / 2, frontY, rw * 0.55, rh * 0.05, 0.55 * Math.sin(Math.PI * q))
        }
      } else {
        const ignite = Math.min(clock / COOLING.hearthIgniteS, 1)
        unitFill(ctx, glow, w / 2, h * 1.02, w * 0.62, h * 0.24, ignite * (0.34 + 0.12 * Math.sin((clock * TAU) / COOLING.breathS)))
      }
      ctx.restore()

      ctx.globalCompositeOperation = 'lighter'
      let fill = '' // fillStyle writes parse CSS — engine idiom: only on change

      // 2 — steam-white flashes on the rows the front just crossed, at that
      // row's REAL left/right intercepts — the quench passing through cloth.
      if (garment && q > 0 && q < 1.15) {
        const frontRow = Math.floor((garment.top + smooth(Math.min(q, 1)) * (garment.bottom - garment.top)) * garment.rowCount)
        const linger = q < 1 ? 1 : 1 - (q - 1) / 0.15
        if (colors.steam !== fill) ctx.fillStyle = fill = colors.steam
        for (let k = 0; k < EDGE_TRAIL_ROWS; k += 1) {
          const row = garment.rows[frontRow - k]
          if (!row) continue
          const alpha = (1 - k / EDGE_TRAIL_ROWS) * 0.6 * linger
          if (alpha <= ALPHA_FLOOR) continue
          const y = ry + ((frontRow - k + 0.5) / garment.rowCount) * rh
          ctx.globalAlpha = alpha
          for (const ex of [row.left, row.right]) {
            ctx.beginPath()
            ctx.arc(rx + ex * rw, y, 1.7, 0, TAU)
            ctx.fill()
          }
        }
      }

      // 3 — contour embers: glowing on the edge, then detaching upward-outward.
      for (const e of embers) {
        let p = (clock - e.born) / e.life
        if (p >= 1) { respawn(e, clock); p = 0 }
        let [x, y] = [0, 0]
        if (garment) {
          const i = e.idx
          const [ex, ey] = [rx + garment.pts[i * 2] * rw, ry + garment.pts[i * 2 + 1] * rh]
          const [nx, ny] = [garment.normals[i * 2], garment.normals[i * 2 + 1]]
          if (p < ATTACH_FRAC) {
            const k = p / ATTACH_FRAC // glowing ON the edge, barely lifting
            ;[x, y] = [ex + nx * 1.5 * k, ey + ny * 1.5 * k]
          } else {
            const t = (p - ATTACH_FRAC) / (1 - ATTACH_FRAC)
            const d = easeOut(t) // detaches outward, then buoyancy takes it up
            x = ex + nx * e.drift * rh * d + Math.sin(e.phase + t * 3.4) * e.sway * t
            y = ey + ny * e.drift * rh * d - e.rise * rh * t * t
          }
        } else {
          x = e.x01 * w + Math.sin(e.phase + p * 4.2) * e.sway * p
          y = h + 3 - easeOut(p) * e.rise * h // the hearth updraft
        }
        const fadeIn = Math.min(1, p / 0.08)
        const fadeOut = p > 0.62 ? Math.max(0, 1 - (p - 0.62) / 0.38) : 1
        const flicker = 0.72 + 0.28 * Math.sin(clock * 6.5 + e.phase * 9)
        const heat = garment ? heatAt((y - ry) / rh, clock) : 1
        const alpha = (0.9 - 0.25 * p) * fadeIn * fadeOut * fadeOut * flicker * heat
        if (alpha <= ALPHA_FLOOR) continue
        const color = colors.stops[Math.min(COOLING_STEPS - 1, Math.floor(p * COOLING_STEPS))]
        if (color !== fill) ctx.fillStyle = fill = color
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.beginPath()
        ctx.arc(x, y, e.r * (1.2 - 0.55 * p), 0, TAU)
        ctx.fill()
      }

      // 4 — spark events: an edge that still had heat in it lets go.
      if (clock >= nextPopAt) {
        spawnPop(clock)
        nextPopAt = clock + COOLING.popMinGapS + Math.random() * COOLING.popRangeS
      }
      for (const s of sparks) {
        if (s.free) continue
        const t = (clock - s.born) / s.life
        if (t >= 1) { s.free = true; continue }
        const alpha = (1 - t) ** 2
        if (alpha <= ALPHA_FLOOR) continue
        const sec = (clock - s.born) * (1 - 0.35 * t) // decelerating flight
        const color = t < 0.25 ? colors.flash : colors.hot
        if (color !== fill) ctx.fillStyle = fill = color
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.beginPath()
        ctx.arc(s.x + s.vx * sec, s.y + s.vy * sec, s.r, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
    }

    // Accumulated, dt-clamped clock: parks on hidden, resumes exactly where it
    // paused (never fast-forwards, never mass-respawns).
    let clock = 0, last = 0, raf = 0, running = false
    const frame = (now: number) => {
      clock += Math.min((now - last) / 1000, MAX_DT_S)
      last = now
      draw(clock)
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => { running = false; cancelAnimationFrame(raf) }
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    if (!document.hidden) start()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
    }
  }, [shape, tier, reduced, rootRef, canvasRef])
}
