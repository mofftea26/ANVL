import type { ContainedMediaRect } from '@/shared/hooks/useContainedMediaRect'
import type { PassportEffectMarker } from '../effectFacts'
import {
  markerPlacement,
  placementSide,
  resolveStageRegion,
  type MarkerPlacement,
  type StageRegion,
} from './markerGeometry'
import type { SilhouettePoint, SilhouetteRow, SilhouetteSample2D } from './silhouette2d'

/**
 * The Fit tape solver: a silhouette sample + the passport's authored
 * measurements → placed, sized, labelled tapes.
 *
 * Lifted out of `EffectFit.tsx` because the two together clear the repo's
 * 500-line hard limit; this is the half worth reading on its own, being pure —
 * no React, no DOM, no clock. The effect keeps the choreography and the markup.
 *
 * One rule governs every function here: SHAPE is measured, NUMBERS are
 * authored. A tape's span is the garment's real width at its sampled row; the
 * reading on it is a `facts.fit` line the passport actually carries. A sampled
 * width cannot become a centimetre without a scale nobody measured, so a band
 * with no fact gets NO text — the tape still states the shape, and states
 * nothing else. There is deliberately no fallback number in this file.
 *
 * HEIGHT is authored too, when the editor placed the marker: a measurement
 * clicked on the sleeve wraps its tape at the sleeve, not at whichever of the
 * three frozen chest/waist/hem recipes its label happened to match. The
 * recipes remain the fallback for a marker with no placement.
 */

/* 4:5 stage space — both tiers render a 4:5 box, so units are square AND text
   sized in them scales with whichever stage it lands on. */
export const [FIT_VIEW_W, FIT_VIEW_H] = [400, 500]

const MIN_BAND_W = 26 // a degenerate row cannot read as a tape
const [MAJOR_TICK, MINOR_TICK] = [9, 6] // alternating graduation rises

/**
 * THE stage's type scale, in viewBox units. Every glyph the Fit section draws
 * takes one of these sizes, and the steps between them ARE the hierarchy:
 *
 *   value    21    the reading — the one thing here a customer may act on
 *   label    11    the term it names, AND the S · M · L · XL whisper: both are
 *                  annotation about a reading, so both take the same step down
 *   caption  7.5   the atelier tag — a signature, not information
 *
 * One size per ROLE, chosen once for the whole stage (`readoutScale`) rather
 * than once per band. Bands sizing themselves independently is what let three
 * readouts that say the same kind of thing render at three different sizes,
 * and what let a cramped one come out smaller than the whisper beneath it.
 * The `*Min` floors are the only sanctioned deviation and they move every
 * band together.
 */
export const FIT_TYPE = {
  value: 21,
  valueMin: 9,
  label: 11,
  labelMin: 6,
  caption: 7.5,
} as const
/** The deliberate step from a reading down to its term. */
const LABEL_RATIO = FIT_TYPE.label / FIT_TYPE.value
const CHAR_EM = 0.62 // per-character advance incl. tracking, in font sizes
const [EDGE_PAD, VALUE_GAP] = [6, 13]
/**
 * How much width one readout may claim: to the stage's centre line, no
 * further. A readout is anchored past its tape's end and pulled INWARD over
 * the cloth when its string needs the room (the halo in the markup keeps it
 * legible there) — this bounds that pull, and is therefore the budget the
 * SHARED type size is solved against. Without it a single long authored value
 * would either run clear across the far half of the piece or drag every other
 * reading down to the floor size with it.
 */
const READOUT_MAX_W = FIT_VIEW_W / 2 - EDGE_PAD
/* Below this the readout flips above its tape — keep in step with TICKER_Y in
   EffectFit.tsx, whose size whisper owns the stage floor. */
const FLOOR_Y = 452
/* Two readouts closer than this on the SAME side would overlap. The frozen
   recipes alternate sides to make that impossible; authored placements cannot,
   so the lower band flips instead. */
const MIN_READOUT_GAP = 34

/** Band recipes: garment-span fraction, readout side, the fallback height
 *  (fraction of the region) when no silhouette exists, and the labels this row
 *  may honestly own. */
const BAND_RECIPES = [
  { fy: 0.24, ffy: 0.3, side: 1, owns: /chest|bust/i },
  { fy: 0.5, ffy: 0.55, side: -1, owns: /waist|midsection/i },
  { fy: 0.82, ffy: 0.8, side: 1, owns: /hem|sweep|opening/i },
] as const

/** Sheet ≈ half budget: two bands (chest + hem), wider graduations. */
const TIER_CONFIG = {
  console: { bandIndexes: [0, 1, 2], tickStep: 24 },
  sheet: { bandIndexes: [0, 2], tickStep: 36 },
} as const

/** Per-row edges + garment span + outline — everything the tailor reads. */
export interface FitProfile {
  rowCount: number; top: number; bottom: number; aspect: number
  rows: ReadonlyArray<SilhouetteRow | null>
  outline: ReadonlyArray<SilhouettePoint>
}

export function toFitProfile(s: SilhouetteSample2D): FitProfile {
  let [first, last] = [-1, -1]
  s.rows.forEach((r, y) => {
    if (r) [first, last] = [first < 0 ? y : first, y]
  })
  const h = s.maskHeight
  const top = (Math.max(first, 0) + 0.5) / h
  const bottom = (Math.max(last, 0) + 0.5) / h
  return { rowCount: h, rows: s.rows, top, bottom, aspect: s.aspect, outline: s.outline }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** A countable reading: one number with the author's own decimals plus
 *  whatever they wrapped it in. Ranges, "one size", two numbers → null, and
 *  the effect reveals them as written: counting would rewrite the string. */
export interface CountUp { prefix: string; target: number; decimals: number; suffix: string }
function parseCount(value: string): CountUp | null {
  const m = /^(\D*)(\d+(?:\.\d+)?)(\D*)$/.exec(value.trim())
  if (!m) return null
  const dot = m[2].indexOf('.')
  return { prefix: m[1], target: Number(m[2]), decimals: dot < 0 ? 0 : m[2].length - dot - 1, suffix: m[3] }
}

/** What one tape carries: the reading, and where the editor put it (if they did). */
interface FitSlot { fact: PassportEffectMarker | null; place: MarkerPlacement | null }

/**
 * Pair authored measurements with tape rows.
 *
 * A PLACED measurement outranks everything: the editor pointed at a height on
 * the render, so it takes a tape and drags that tape to the height they chose.
 * Placed readings are matched to tapes in vertical order — topmost marker to
 * topmost tape — because the recipe rows run top-to-bottom too, so nothing
 * crosses and the fallback rows stay in their designed order.
 *
 * An UNPLACED measurement keeps the old rule: a label naming a row we actually
 * pick ("Chest" → the chest row) goes there, since hanging a chest reading off
 * the hem tape would state something false; the rest fill remaining rows in
 * authored order — a placement, NOT a claim that the tape spans that
 * measurement. Facts past the last row are dropped rather than crowded in.
 */
function assignFacts(rows: readonly number[], fit: readonly PassportEffectMarker[]): FitSlot[] {
  const slots: FitSlot[] = rows.map(() => ({ fact: null, place: null }))
  const placed: Array<{ fact: PassportEffectMarker; place: MarkerPlacement }> = []
  const loose: PassportEffectMarker[] = []
  for (const fact of fit) {
    const place = markerPlacement(fact)
    if (place) placed.push({ fact, place })
    else loose.push(fact)
  }
  placed
    .sort((a, b) => a.place.y - b.place.y)
    .slice(0, slots.length)
    .forEach((slot, i) => void (slots[i] = slot))
  const rest = loose.filter((f) => {
    const i = rows.findIndex((ri) => BAND_RECIPES[ri].owns.test(f.label))
    if (i < 0 || slots[i].fact) return true
    slots[i] = { fact: f, place: null }
    return false
  })
  for (const fact of rest) {
    const i = slots.findIndex((s) => !s.fact)
    if (i < 0) break
    slots[i] = { fact, place: null }
  }
  return slots
}

const em = (t: string) => Math.max(t.length, 3) * CHAR_EM
/** Width one readout needs per unit of value size. Both its lines hang off the
 *  same anchor, so the wider of the two owns the rail. */
const readoutEm = (fact: PassportEffectMarker) =>
  Math.max(em(fact.value), em(fact.label) * LABEL_RATIO)

/**
 * ONE reading size for the whole stage: the largest tier size at which EVERY
 * authored reading still fits the width a readout may claim.
 *
 * Peers are drawn as peers. A string long enough to need more room pulls the
 * scale down for all of them together rather than quietly rendering itself at
 * some other size — three tapes measuring one garment are one set of readings,
 * and a set with three type sizes in it reads as a mistake, because it was.
 */
export function readoutScale(facts: ReadonlyArray<PassportEffectMarker | null>): number {
  let vfs: number = FIT_TYPE.value
  for (const fact of facts) {
    if (fact) vfs = Math.min(vfs, READOUT_MAX_W / readoutEm(fact))
  }
  return clamp(vfs, FIT_TYPE.valueMin, FIT_TYPE.value)
}

/** The term tier: its deliberate step below the reading, given up only where a
 *  band's own rail came out narrower than the label it carries. */
function labelScale(rails: ReadonlyArray<{ room: number; fact: PassportEffectMarker | null }>, vfs: number): number {
  let lfs = vfs * LABEL_RATIO
  for (const { room, fact } of rails) if (fact) lfs = Math.min(lfs, room / em(fact.label))
  return clamp(lfs, FIT_TYPE.labelMin, FIT_TYPE.label)
}

/** Where one band's readout hangs, and the room it ended up with. The anchor
 *  sits past the tape's end and is pulled inward only as far as this band's own
 *  string needs AT THE SHARED SIZE — never past the centre line, since that is
 *  the budget the shared size was solved against. `side` comes from the caller:
 *  the marker's own half of the piece when it was placed, the recipe's
 *  alternating side when it was not. */
function placeReadout(lx: number, rx: number, side: number, fact: PassportEffectMarker | null, vfs: number) {
  const need = fact ? readoutEm(fact) * vfs : 0
  const right = side > 0
  const vx = right ? Math.min(rx + VALUE_GAP, FIT_VIEW_W - EDGE_PAD - need) : Math.max(lx - VALUE_GAP, EDGE_PAD + need)
  const room = right ? FIT_VIEW_W - EDGE_PAD - vx : vx - EDGE_PAD
  return { vx, room, anchor: (right ? 'start' : 'end') as 'start' | 'end' }
}

/** The two lines' rows. Within reach of the floor they swap, so a low hem
 *  never drops its number onto the size whisper. */
function readoutRows(y: number, vfs: number, lfs: number) {
  const below = y + vfs * 0.8 + 3 < FLOOR_Y
  return {
    valueY: below ? y + vfs * 0.8 + 3 : y - 6,
    labelY: below ? y - (lfs * 0.6 + 5) : y + lfs * 0.85 + 5,
  }
}

/** Nearest row that actually holds cloth — a tape must rest on the garment. */
function nearestRow(p: FitProfile, target: number): number {
  for (let d = 0; d < p.rowCount; d += 1) {
    if (target - d >= 0 && p.rows[target - d]) return target - d
    if (target + d < p.rowCount && p.rows[target + d]) return target + d
  }
  return target
}

const rowAtFraction = (p: FitProfile, f: number) =>
  nearestRow(p, clamp(Math.round(f * p.rowCount - 0.5), 0, p.rowCount - 1))

/** Recipe row: a fraction of the GARMENT's span (hem-to-shoulder). */
const bandRow = (p: FitProfile, fy: number) =>
  rowAtFraction(p, p.top + fy * (p.bottom - p.top))

/** Authored row: a fraction of the IMAGE box — the marker's own space, the
 *  same one `PassportHotspots` pins to. */
const markerRow = (p: FitProfile, place: MarkerPlacement) => rowAtFraction(p, place.y / 100)

/** Mean of the row and its populated neighbours — steadies raster noise. */
function meanEdge(p: FitProfile, row: number): SilhouetteRow {
  let [l, r, c] = [0, 0, 0]
  for (let y = row - 1; y <= row + 1; y += 1) {
    const e = y >= 0 && y < p.rowCount ? p.rows[y] : null
    if (!e) continue
    ;[l, r, c] = [l + e.left, r + e.right, c + 1]
  }
  return c > 0 ? { left: l / c, right: r / c } : { left: 0.3, right: 0.7 }
}

/** Point at Bézier parameter t on a band's sagging tape (quadratic bow).
 *  t is the curve parameter, not arc length — on this shallow a bow the
 *  drift against the dash-drawn front is sub-pixel. */
export function tapePoint(lx: number, rx: number, y: number, bow: number, t: number) {
  const mt = 1 - t
  return { x: mt * mt * lx + 2 * mt * t * ((lx + rx) / 2) + t * t * rx, y: y + 2 * mt * t * bow }
}

export interface FitBand {
  y: number; lx: number; rx: number; bow: number
  d: string
  ticks: Array<{ x: number; y: number; rise: number }>
  /** The authored reading this tape carries — null ⇒ geometry, no claim. */
  fact: PassportEffectMarker | null
  /** Count-up target, when the authored value is a clean number + unit. */
  count: CountUp | null
  vx: number; vfs: number; lfs: number; valueY: number; labelY: number
  anchor: 'start' | 'end'
}
/** A pin stop: outline arc fraction + its viewBox position. */
export interface PinStop { f: number; x: number; y: number }
export interface FitLayout {
  bands: FitBand[]
  /** The garment outline in viewBox units — null in the fallback. */
  outline: Array<{ x: number; y: number }> | null
  /** Pin stops (band-edge ∩ outline), sorted by arc position. */
  stops: PinStop[]
}

/** Nearest outline point to a band end — where the pin actually lands. */
function stopAt(pts: Array<{ x: number; y: number }>, x: number, y: number): PinStop {
  let best = 0
  let bd = Infinity
  for (let i = 0; i < pts.length; i += 1) {
    const d2 = (pts[i].x - x) ** 2 + (pts[i].y - y) ** 2
    if (d2 < bd) [bd, best] = [d2, i]
  }
  return { f: best / pts.length, x: pts[best].x, y: pts[best].y }
}

export function buildFitLayout(profile: FitProfile | null, rect: ContainedMediaRect | null, tier: 'console' | 'sheet', fit: readonly PassportEffectMarker[]): FitLayout {
  const R: StageRegion = resolveStageRegion(rect, profile?.aspect, FIT_VIEW_W, FIT_VIEW_H)
  const cfg = TIER_CONFIG[tier]
  const slots = assignFacts(cfg.bandIndexes, fit)
  /* Readout sides alternate by recipe so adjacent bands cannot collide. An
     authored side follows its marker's own half of the piece instead, so the
     previous band is tracked to flip a would-be overlap. */
  let prev = { y: -Infinity, side: 0 }
  /* Geometry first, type second: the readings can only be sized as a set once
     the whole set is known, so this pass places tapes and the pass below hangs
     text on them at the stage's shared sizes. */
  const geo = cfg.bandIndexes.map((ri, si) => {
    const recipe = BAND_RECIPES[ri]
    const { fact, place } = slots[si]
    let lx = R.x + 0.08 * R.w
    let rx = R.x + 0.92 * R.w
    // Authored height wins even with no silhouette to sample: the editor's
    // click is real data, the recipe fraction is only a plausible guess.
    let y = R.y + (place ? place.y / 100 : recipe.ffy) * R.h
    let bow = 0 // the fallback is the honest ruler — it measured nothing
    if (profile) {
      const row = place ? markerRow(profile, place) : bandRow(profile, recipe.fy)
      const edge = meanEdge(profile, row)
      lx = R.x + edge.left * R.w
      rx = R.x + edge.right * R.w
      y = clamp(R.y + ((row + 0.5) / profile.rowCount) * R.h, 12, FIT_VIEW_H - 30)
      if (rx - lx < MIN_BAND_W) {
        const c = (lx + rx) / 2
        ;[lx, rx] = [c - MIN_BAND_W / 2, c + MIN_BAND_W / 2]
      }
      bow = clamp((rx - lx) * 0.055, 2, 10) // the tape rests against a body
    }
    let side: number = place ? placementSide(place) : recipe.side
    if (side === prev.side && y - prev.y < MIN_READOUT_GAP) side = -side
    prev = { y, side }
    const tickCount = Math.max(4, Math.round((rx - lx) / cfg.tickStep))
    const ticks: FitBand['ticks'] = []
    for (let i = 1; i < tickCount; i += 1) {
      const p = tapePoint(lx, rx, y, bow, i / tickCount)
      ticks.push({ x: p.x, y: p.y, rise: i % 2 === 0 ? MAJOR_TICK : MINOR_TICK })
    }
    return {
      side,
      row: {
        y, lx, rx, bow, ticks, fact, count: fact ? parseCount(fact.value) : null,
        d: `M ${lx.toFixed(1)} ${y.toFixed(1)} Q ${((lx + rx) / 2).toFixed(1)} ${(y + bow).toFixed(1)} ${rx.toFixed(1)} ${y.toFixed(1)}`,
      },
    }
  })
  // Type is a STAGE decision, never a band one — see `readoutScale`.
  const vfs = readoutScale(geo.map((g) => g.row.fact))
  const rails = geo.map((g) => placeReadout(g.row.lx, g.row.rx, g.side, g.row.fact, vfs))
  const lfs = labelScale(rails.map((rail, i) => ({ room: rail.room, fact: geo[i].row.fact })), vfs)
  const bands: FitBand[] = geo.map((g, i) => ({
    ...g.row,
    vx: rails[i].vx,
    anchor: rails[i].anchor,
    vfs,
    lfs,
    ...readoutRows(g.row.y, vfs, lfs),
  }))
  let outline: FitLayout['outline'] = null
  const stops: PinStop[] = []
  if (profile && profile.outline.length > 2) {
    const pts = profile.outline.map((p) => ({ x: R.x + p.x * R.w, y: R.y + p.y * R.h }))
    outline = pts
    for (const b of bands) stops.push(stopAt(pts, b.lx, b.y), stopAt(pts, b.rx, b.y))
    stops.sort((a, b) => a.f - b.f)
  }
  return { bands, outline, stops }
}
