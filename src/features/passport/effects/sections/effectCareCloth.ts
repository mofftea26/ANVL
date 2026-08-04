import { mix, withAlpha } from '@/shared/lib/color'
import { readThemeCssColor } from '@/shared/lib/themeColor'
import type { SilhouetteSample2D } from '../lib/silhouette2d'

/**
 * The cloth model behind the Care ritual ("The Keeping" — see EffectCare.tsx).
 *
 * Everything here is PURE: the choreography clock, the pile/mote/pass shapes,
 * and the two ways a piece of cloth can be derived — from THIS garment's
 * silhouette mask, or from the designed folded-panel fallback. No React, no
 * canvas, so the geometry is unit-testable from synthetic samples and the
 * effect file stays inside the size limit.
 *
 * CHUNK HYGIENE: like every 2D passport effect, this module must never import
 * `@/shared/webgl/particleShapes` (top-level three.js would drag
 * `vendor-three` into the lazy 2D chunk) — see docs/animation-guidelines.md,
 * "Passport section effects".
 */

export const TAU = Math.PI * 2
export const FALLBACK_W = 416 // jsdom / unmeasured mounts report 0×0 — console 4:5
export const FALLBACK_H = 520
export const MAX_FRAME_S = 0.064 // a hidden tab must not fast-forward the hand

/** One choreography clock (house standard) — every beat reads from here. */
export const KEEP = {
  firstPass: 0.35, // the hand reaches the cloth almost immediately
  passS: 2.4, // one smoothing pass crosses the piece
  passEvery: 5.5, // …and returns BEFORE the field has finished settling
  combS: 0.6, // one tuft's realignment behind the front
  freshS: 3.2, // how long a just-kept tuft carries its warm sheen
  rimS: 1.5, // the restored highlight running the true contour
  /* The pile is NEVER still. Every tuft rotates by ±swayAmp and breathes its
     length by ±lenBreath on its own phase and its own rate, so between the
     hand's passes the composition is alive in GEOMETRY (which costs nothing —
     the per-tuft loop already runs every frame) rather than in alpha alone. */
  swayAmp: 0.11, // radians of continuous tuft rotation
  lenBreath: 0.12, // …and the matching length breath, same phase
  swayMin: 1.1, // per-tuft sway rate (rad/s) — a ~3–6s personal cycle
  swayMax: 2.0,
  breathS: 9, // the whole field's slow common swell
  /* One base/amplitude pair for that swell, shared by the pile AND the rim —
     two formulas for one named cycle is how they drift apart. */
  breathBase: 0.88,
  breathAmp: 0.12,
  poolR: 0.38, // the hand's light: a palm-sized pool, as a share of the span
  poolWander: 0.13, // …drifting across the pass axis, so it reads as a hand
  poolWanderRate: 0.9,
  moteLife: 5,
} as const

/** Console = full budget; sheet ≈ half (the section-effect standard). */
export const COUNTS = {
  console: { nap: 120, motes: 12 },
  sheet: { nap: 60, motes: 6 },
} as const

export const NAP_MAX_ALPHA = 0.26
/**
 * SIX batched alpha steps, not four. A tuft's own shimmer spans roughly 1.5
 * steps here, so the modulation the pile is drawn with is deliberate — with
 * four steps a settled tuft sat in one bucket for its whole cycle and the
 * "breathing" was arithmetic that never reached a pixel.
 */
export const NAP_BUCKETS = [0.05, 0.085, 0.12, 0.155, 0.19, 0.24] as const
/** bone → warm → ember: a kept tuft cools in THREE steps, never one snap. */
export const NAP_TONES = 3
export const POOL_ALPHA = 0.1 // light on cloth — capped far under the copy threshold
export const RIM_ALPHA = 0.1
export const RIM_ARC = 0.13 // the restored highlight's share of the contour
export const MOTE_ALPHA = 0.26
const CLOTH_PTS = 128
const CREASES = 2
/* Rejection sampling is bounded per seed, and the yield gate is set where a
   real garment could never land: a tee, hoodie or jogger fills 60–90% of its
   own row spans, so anything under ~5% is a shape the pile cannot describe
   (a wire frame, a pair of hairlines) and the folded panel is the better
   composition. A generous try budget with a token gate would have made the
   fallback ladder unreachable rather than merely rare. */
const SEED_TRIES_PER_POINT = 10
const SEED_MIN_YIELD = 0.55

export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const easeInOut = (x: number) => x * x * (3 - 2 * x)

/** Shortest rotation for a BIDIRECTIONAL stroke — a tuft has no head or tail. */
export function shortestTurn(delta: number): number {
  let d = delta % Math.PI
  if (d > Math.PI / 2) d -= Math.PI
  if (d < -Math.PI / 2) d += Math.PI
  return d
}

export interface KeepPalette {
  bone: string
  /** The middle of the cool-down: half-way from a kept sheen back to bone. */
  warm: string
  graphite: string
  ember: string
  /** The hand's light, mid-falloff — the palm has no hard edge. */
  poolMid: string
}

/** Read once at mount — the theme cannot change while a section is open. */
export const readKeepPalette = (): KeepPalette => {
  const bone = readThemeCssColor('--color-heading', '#e7e4df')
  const ember = readThemeCssColor('--color-highlight-bright', '#e08a4a')
  return {
    bone,
    warm: mix(bone, ember, 0.5),
    graphite: readThemeCssColor('--color-text-muted', '#bab8b3'),
    ember,
    poolMid: withAlpha(bone, 0.42),
  }
}

/** The cloth the ritual keeps — real garment, or the folded-panel fallback. */
export interface CareShape {
  mode: 'garment' | 'cloth'
  aspect: number
  /** Closed loop, normalized image-box coords. */
  outline: Float32Array
  /** Interior points the pile stands on, normalized image-box coords. */
  seeds: Float32Array
  /** Fold lines (fallback only): flat x1,y1,x2,y2 quads. */
  creases: Float32Array
}

/** One tuft of pile: where it stands, how it lies, when it was last kept. */
export interface Nap {
  x: number
  y: number
  lenN: number
  angle: number
  from: number
  turn: number
  combedAt: number
  pass: number
  ph: number
  /** Per-fibre light gain — no two tufts catch the light identically. */
  gain: number
  /** …and its own sway rate, so the pile scintillates instead of pulsing. */
  rate: number
}

/** A mote lifted off the cloth by the hand, drifting away. */
export interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  born: number
  life: number
  r: number
}

/** One smoothing pass: a direction, a front travelling along it, and the
 *  lateral wander of the palm's light across that axis. */
export interface Pass {
  id: number
  cos: number
  sin: number
  d0: number
  d1: number
  start: number
  wander: number
}

/** Rejection-sample the MASK so every tuft lands on real fabric. */
export function buildSeeds(sample: SilhouetteSample2D, count: number): Float32Array | null {
  const { rows, mask, maskWidth: W, maskHeight: H } = sample
  const filled: number[] = []
  for (let y = 0; y < H; y += 1) if (rows[y]) filled.push(y)
  if (filled.length < 4) return null
  const out = new Float32Array(count * 2)
  let got = 0
  const tries = count * SEED_TRIES_PER_POINT
  for (let k = 0; k < tries && got < count; k += 1) {
    const y = filled[(Math.random() * filled.length) | 0]
    const row = rows[y]
    if (!row) continue
    const u = row.left + Math.random() * (row.right - row.left)
    const mx = Math.min(W - 1, Math.max(0, Math.floor(u * W)))
    if (!mask[y * W + mx]) continue // the gap between two legs is not cloth
    out[got * 2] = (mx + 0.5) / W
    out[got * 2 + 1] = (y + 0.5) / H
    got += 1
  }
  if (got < count * SEED_MIN_YIELD) return null // too sparse to read as cloth
  return got === count ? out : out.slice(0, got * 2)
}

/** THIS garment as cloth: its true contour plus pile standing on real pixels. */
export function toCareShape(sample: SilhouetteSample2D, count: number): CareShape | null {
  const seeds = buildSeeds(sample, count)
  if (!seeds) return null
  const outline = new Float32Array(sample.outline.length * 2)
  sample.outline.forEach((p, i) => {
    outline[i * 2] = p.x
    outline[i * 2 + 1] = p.y
  })
  return { mode: 'garment', aspect: sample.aspect, outline, seeds, creases: new Float32Array(0) }
}

/** No silhouette: a folded cloth panel at rest — the same pile, same ritual. */
export function buildClothPanel(count: number): CareShape {
  const [cx, cy, hw, hh] = [0.5, 0.53, 0.3, 0.22]
  const outline = new Float32Array(CLOTH_PTS * 2)
  for (let i = 0; i < CLOTH_PTS; i += 1) {
    const a = (i / CLOTH_PTS) * TAU
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    // Superellipse: a folded panel's softened corners, not an oval.
    outline[i * 2] = cx + hw * Math.sign(ca) * Math.abs(ca) ** 0.5
    outline[i * 2 + 1] = cy + hh * Math.sign(sa) * Math.abs(sa) ** 0.5
  }
  const seeds = new Float32Array(count * 2)
  let got = 0
  for (let tries = 0; tries < count * 40 && got < count; tries += 1) {
    const x = rand(cx - hw, cx + hw)
    const y = rand(cy - hh, cy + hh)
    if (((x - cx) / hw) ** 4 + ((y - cy) / hh) ** 4 > 1) continue
    seeds[got * 2] = x
    seeds[got * 2 + 1] = y
    got += 1
  }
  const creases = new Float32Array(CREASES * 4)
  for (let k = 0; k < CREASES; k += 1) {
    const y = cy - hh * 0.34 + k * hh * 0.68
    creases[k * 4] = cx - hw * 0.86
    creases[k * 4 + 1] = y
    creases[k * 4 + 2] = cx + hw * 0.86
    creases[k * 4 + 3] = y
  }
  return { mode: 'cloth', aspect: 4 / 5, outline, seeds: seeds.slice(0, got * 2), creases }
}

/** The pile as it starts life: disordered, a piece just come off the body. */
export function buildNaps(shape: CareShape): Nap[] {
  const naps: Nap[] = []
  for (let i = 0; i < shape.seeds.length / 2; i += 1)
    naps.push({
      x: shape.seeds[i * 2],
      y: shape.seeds[i * 2 + 1],
      lenN: rand(0.022, 0.045),
      angle: Math.random() * Math.PI,
      from: 0,
      turn: 0,
      combedAt: -1,
      pass: -1,
      ph: Math.random() * TAU,
      gain: rand(0.82, 1.18),
      rate: rand(KEEP.swayMin, KEEP.swayMax),
    })
  return naps
}

/** Ages behind the still's clock: ember / warm / bone, by `KEEP.freshS`. */
const STILL_AGES = [0, 1.8, 5.5] as const
/** The still's clock. Past every age above, so no tuft reads as un-combed. */
export const STILL_AT = 6

/**
 * The still's pile: fully combed down the piece, but staggered through the
 * cool-down so all three tones are on screen at once — an authored resting
 * composition (a piece freshly kept), not a paused frame of the loop.
 */
export function settleForStill(naps: Nap[]) {
  naps.forEach((nap, i) => {
    nap.from = Math.PI / 2 + rand(-0.12, 0.12)
    nap.turn = 0
    nap.combedAt = STILL_AT - STILL_AGES[i % STILL_AGES.length]
  })
}
