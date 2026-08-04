import { readThemeCssColor } from '@/shared/lib/themeColor'
import type { SilhouetteSample2D } from '../lib/silhouette2d'

/**
 * The record model behind Forge notes ("The Revision Stack" — see
 * EffectForgeNotes.tsx).
 *
 * Everything here is PURE: the choreography clock, and the shapes a
 * development record is made of — an attempt (a closed loop, its bounds, its
 * rule lines), the cross-out that supersedes it, and the CORRECTION that
 * holds a superseded edge beside the one which replaced it. Two ways an
 * attempt can be drawn: THIS garment's contour traced again with fresh
 * deviations, or the designed spec-sheet fallback. No React, no canvas, so
 * the geometry is unit-testable and the effect file stays inside the size
 * limit.
 *
 * CHUNK HYGIENE: like every 2D passport effect, this module must never import
 * `@/shared/webgl/particleShapes` (top-level three.js would drag
 * `vendor-three` into the lazy 2D chunk) — see docs/animation-guidelines.md,
 * "Passport section effects".
 */

export const TAU = Math.PI * 2
export const FALLBACK_W = 416 // jsdom / unmeasured mounts report 0×0 — console 4:5
export const FALLBACK_H = 520
export const MAX_FRAME_S = 0.064 // a hidden tab must not teleport the pen

/** The choreography clock (seconds) — every beat of the record reads here. */
export const NOTES = {
  ghostIn: 0.5, // one archived revision's fade-up
  ghostStagger: 0.16, // …and the gap between them as the stack assembles
  seedStrikeAt: 0.45, // the newest archived sheet is struck LIVE, on mount
  penStart: 0.3, // the current revision starts being drawn almost at once
  traceS: 1.6, // one full contour lap of the pen
  reviseEvery: 5, // a new revision supersedes the current one
  strikeS: 0.4, // the cross-out stroke over the superseded revision
  retireS: 1.2, // the oldest sheet leaving the back of the stack
  /* The correction — the gesture only a revision record has. Lift the old
     edge off the piece, tick off where it moved, reject it, throw it away.
     Cadence and hold are tight enough that a correction is on screen, or
     arriving, in every three-second window of the cycle. */
  corrFirst: 2.1,
  corrEvery: 3.2,
  corrLift: 0.5,
  corrHold: 1.2,
  corrDrop: 0.9,
  markS: 0.35, // the rejection x struck through the discarded edge
  /* Tracing paper really does shift under a light. Each sheet translates on
     its OWN slow cycle, so the stack is in motion even in the gaps between
     revisions and corrections — the idle lives in geometry, not in alpha. */
  driftMinS: 5,
  driftMaxS: 9,
  driftMin: 0.008, // …by 3–6px on a console-sized stage
  driftMax: 0.014,
  /* Every sheet drifts on the same terms, current included: a per-state
     amplitude would jump the most prominent sheet the instant it is demoted. */
  ghostArrive: 2.6, // how much further out a sheet starts before settling in
} as const

/**
 * Console = full budget; sheet = EXACTLY half (the section-effect standard).
 * Two revisions is the floor at which a stack still reads as a stack: one
 * superseded sheet under the one that replaced it.
 */
export const COUNTS = {
  console: { revisions: 4, corrections: 2, tally: 6 },
  sheet: { revisions: 2, corrections: 1, tally: 3 },
} as const

const SHEET_PTS = 120 // samples around one fallback sheet
export const NOTE_DASHES = 3 // the fallback sheet's ruled note lines
export const CORRECTION_SPAN = 0.14 // share of the loop one correction lifts
export const CORRECTION_TICKS = 5 // deviation ticks drawn across the gap

export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const easeInOut = (x: number) => x * x * (3 - 2 * x)
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3

export interface NotePalette {
  bone: string
  graphite: string
  ember: string
}

/** Read once at mount — the theme cannot change while a section is open. */
export const readNotePalette = (): NotePalette => ({
  bone: readThemeCssColor('--color-heading', '#e7e4df'),
  graphite: readThemeCssColor('--color-text-muted', '#bab8b3'),
  ember: readThemeCssColor('--color-highlight-bright', '#e08a4a'),
})

/** The traced contour + centroid + aspect, all in normalized image-box space. */
export interface Shape {
  pts: Float32Array
  cx: number
  cy: number
  aspect: number
}

export function toShape(sample: SilhouetteSample2D): Shape {
  const pts = new Float32Array(sample.outline.length * 2)
  sample.outline.forEach((p, i) => {
    pts[i * 2] = p.x
    pts[i * 2 + 1] = p.y
  })
  return { pts, cx: sample.centroid.x, cy: sample.centroid.y, aspect: sample.aspect }
}

/** One drawn attempt: a closed loop, its bounds, and (sheets only) rules. */
export interface Loop {
  pts: Float32Array
  rules: Float32Array // flat x1,y1,x2,y2 quads — empty for garment revisions
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function boundsOf(pts: Float32Array, rules: Float32Array): Loop {
  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0
  for (let i = 0; i < pts.length; i += 2) {
    minX = Math.min(minX, pts[i])
    maxX = Math.max(maxX, pts[i])
    minY = Math.min(minY, pts[i + 1])
    maxY = Math.max(maxY, pts[i + 1])
  }
  return { pts, rules, minX, minY, maxX, maxY }
}

/**
 * The garment, traced again. Scale/offset jitter plus two radial harmonics —
 * the same piece redrawn by the same hand, never pixel-identical.
 *
 * The budget is deliberately generous (up to ~6% of the box at the extremes,
 * typically ~3%): with a ±1% deviation the sheets landed inside each other
 * and the stack read as a blur halo rather than as separate attempts.
 */
function traceAgain(shape: Shape): Loop {
  const n = shape.pts.length / 2
  const pts = new Float32Array(shape.pts.length)
  const s = 0.978 + Math.random() * 0.044
  const dx = rand(-0.022, 0.022)
  const dy = rand(-0.022, 0.022)
  const k1 = 2 + Math.floor(Math.random() * 3)
  const k2 = 5 + Math.floor(Math.random() * 4)
  const p1 = Math.random() * TAU
  const p2 = Math.random() * TAU
  const a1 = rand(0.01, 0.02)
  const a2 = rand(0.005, 0.011)
  for (let i = 0; i < n; i += 1) {
    const x = shape.pts[i * 2] - shape.cx
    const y = shape.pts[i * 2 + 1] - shape.cy
    const th = Math.atan2(y, x)
    const r = Math.max(0.05, Math.hypot(x, y))
    const g = 1 + (a1 * Math.sin(k1 * th + p1) + a2 * Math.sin(k2 * th + p2)) / r
    pts[i * 2] = shape.cx + x * s * g + dx
    pts[i * 2 + 1] = shape.cy + y * s * g + dy
  }
  return boundsOf(pts, new Float32Array(0))
}

/** No silhouette: a ruled spec sheet — the same record, on paper. */
function sheetLoop(): Loop {
  const cx = 0.5 + rand(-0.035, 0.035)
  const cy = 0.52 + rand(-0.035, 0.035)
  const hw = 0.29 + rand(-0.018, 0.018)
  const hh = 0.21 + rand(-0.014, 0.014)
  const rot = rand(-0.07, 0.07)
  const cr = Math.cos(rot)
  const sr = Math.sin(rot)
  const pts = new Float32Array(SHEET_PTS * 2)
  for (let i = 0; i < SHEET_PTS; i += 1) {
    const a = (i / SHEET_PTS) * TAU
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    // Superellipse: a sheet of paper with softened corners, not an oval.
    const x = hw * Math.sign(ca) * Math.abs(ca) ** 0.5
    const y = hh * Math.sign(sa) * Math.abs(sa) ** 0.5
    pts[i * 2] = cx + x * cr - y * sr
    pts[i * 2 + 1] = cy + x * sr + y * cr
  }
  // Ruled note lines — the sheet is a written record, not a blank card.
  const rules = new Float32Array(NOTE_DASHES * 4)
  for (let k = 0; k < NOTE_DASHES; k += 1) {
    const ly = cy - hh * 0.42 + (k / (NOTE_DASHES - 1)) * hh * 0.84
    const half = hw * rand(0.3, 0.62)
    const lx = cx - hw * 0.5
    rules[k * 4] = lx - half * cr
    rules[k * 4 + 1] = ly - half * sr
    rules[k * 4 + 2] = lx + half * cr
    rules[k * 4 + 3] = ly + half * sr
  }
  return boundsOf(pts, rules)
}

/** One attempt in the record — current while `demotedAt < 0`, then a ghost. */
export interface Revision {
  loop: Loop
  born: number
  penned: boolean // drawn live by the pen (the current) vs. already archived
  demotedAt: number
  retiredAt: number
  rank: number
  strike: readonly [number, number, number, number] | null
  strikeAt: number
  ph: number
  /** This sheet's own shift-under-the-light cycle (seconds) and amplitude. */
  driftS: number
  driftAmp: number
}

/** A struck diagonal across an attempt's bounds — the hand, not a ruler. */
export function strikeAcross(loop: Loop): readonly [number, number, number, number] {
  const spanY = loop.maxY - loop.minY
  return [
    loop.minX - 0.02,
    loop.minY + spanY * rand(0.12, 0.3),
    loop.maxX + 0.02,
    loop.minY + spanY * rand(0.66, 0.86),
  ] as const
}

export function makeRevision(t: number, penned: boolean, shape: Shape | null): Revision {
  return {
    loop: shape ? traceAgain(shape) : sheetLoop(),
    born: t,
    penned,
    demotedAt: -1,
    retiredAt: -1,
    rank: 0,
    strike: null,
    strikeAt: -1,
    ph: Math.random() * TAU,
    driftS: rand(NOTES.driftMinS, NOTES.driftMaxS),
    driftAmp: rand(NOTES.driftMin, NOTES.driftMax),
  }
}

/**
 * Seed a mount-time sheet as ALREADY superseded.
 *
 * The stack a record opens with is history, so its cross-outs belong on
 * screen from the first second. Without this the seeded ghosts still read as
 * "current" (`demotedAt < 0`) and the first live revise struck ALL of them at
 * once — four cross-outs popping together after eight silent seconds, the
 * composition contradicting its own narrative on its loudest beat.
 */
export function archived(rev: Revision, strikeAt: number): Revision {
  rev.demotedAt = rev.born
  rev.strike = strikeAcross(rev.loop)
  rev.strikeAt = strikeAt
  return rev
}

/**
 * Supersede whatever attempt is current: strike it, archive it, age the whole
 * stack one rank. Returns how many attempts were struck — exactly one, always,
 * which is the invariant the seeding above exists to protect.
 */
export function supersedeCurrent(revisions: readonly Revision[], t: number): number {
  let struck = 0
  for (const rev of revisions) {
    if (rev.demotedAt < 0) {
      rev.demotedAt = t
      rev.strike = strikeAcross(rev.loop)
      rev.strikeAt = t
      struck += 1
    }
    rev.rank += 1
  }
  return struck
}

/**
 * A correction: one span of the contour, in BOTH the superseded attempt's
 * version and the version that replaced it. Nothing else in the passport says
 * "this edge moved between attempts" — it is the record's own vocabulary,
 * where a ringed anchor pulled out to a margin chip is the instrument panel's.
 */
export interface Correction {
  born: number
  /** The edge that replaced it — the current attempt's span. */
  next: Float32Array
  /** The superseded edge, held beside it, then discarded. */
  prev: Float32Array
  /** Outward direction the discarded span is lifted and thrown along. */
  nx: number
  ny: number
}

export function makeCorrection(
  t: number,
  next: Loop,
  prev: Loop,
  cx: number,
  cy: number,
): Correction | null {
  const n = Math.min(next.pts.length, prev.pts.length) / 2
  const len = Math.max(6, Math.round(n * CORRECTION_SPAN))
  if (n < len + 2) return null
  const i0 = (Math.random() * n) | 0
  const a = new Float32Array(len * 2)
  const b = new Float32Array(len * 2)
  let mx = 0
  let my = 0
  for (let k = 0; k < len; k += 1) {
    const i = (i0 + k) % n
    a[k * 2] = next.pts[i * 2]
    a[k * 2 + 1] = next.pts[i * 2 + 1]
    b[k * 2] = prev.pts[i * 2]
    b[k * 2 + 1] = prev.pts[i * 2 + 1]
    mx += b[k * 2]
    my += b[k * 2 + 1]
  }
  mx /= len
  my /= len
  const dx = mx - cx
  const dy = my - cy
  const dl = Math.hypot(dx, dy) || 1
  return { born: t, next: a, prev: b, nx: dx / dl, ny: dy / dl }
}

/** Total life of one correction — lift, hold, discard. */
export const correctionLife = () => NOTES.corrLift + NOTES.corrHold + NOTES.corrDrop
