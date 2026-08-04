import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { useContainedMediaRect, type ContainedMediaRect } from '@/shared/hooks/useContainedMediaRect'
import type { PassportEffectMarker } from '../effectFacts'
import type { PassportEffectProps } from '../effectTypes'
import {
  markerPlacement,
  placeOnRegion,
  placementSide,
  resolveStageRegion,
  type StageRegion,
} from '../lib/markerGeometry'
import { sampleSilhouette2D, type SilhouetteRow, type SilhouetteSample2D } from '../lib/silhouette2d'

/**
 * Specifications — "Live Analysis".
 *
 * The garment under continuous instrument analysis: a scan band sweeps the
 * piece and visibly KNOWS its shape — intercept dots flare where it crosses
 * the silhouette's edges, a width readout ticking between them. As the first
 * pass reaches them, anchors ping onto the garment and leaders run out to
 * plated chips that type the piece's REAL spec stats; a rotating reticle then
 * locks anchor to anchor, re-reading the chip it leaves. It never finishes.
 *
 * The readings are `facts.specs` (see `../effectFacts`) — the same stats, in
 * the same order, the Specifications card lists beside the image, so overlay
 * and card cannot disagree. NOTHING here invents a spec: with no authored
 * stats there are no chips, leaders or anchors at all and the effect degrades
 * to its shape-only half (band + intercepts), which is still true of the
 * piece. More stats than rails is normal, so the reticle's re-type walks the
 * SPARE stats; with no spares it re-reads the same one.
 *
 * Shape is a per-row edge profile from `../lib/silhouette2d` (canvas 2D — no
 * `vendor-three` here), mapped through the DISPLAYED `object-contain` rect
 * (`useContainedMediaRect`), never the raw 4:5 box. Motion is GSAP timeline
 * work on refs. The markup is authored AT REST (anchors lit, chips typed,
 * band hidden), so reduced motion and the pre-sample beat render it with zero
 * GSAP and the animated path only ever converges back to it. Over the
 * 300-line soft limit deliberately: solver + choreography + markup, one file.
 */

/* 4:5 stage space — both host tiers render a 4:5 box, so units are square. */
const [VIEW_W, VIEW_H] = [400, 500]

/* Theme tokens at runtime; oath-dark literals keep jsdom/var-less hosts on-brand. */
const BONE = 'var(--color-heading, #E7E4DF)'
const CHAMPAGNE = 'var(--color-highlight-bright, #e08a4a)'
const PLATE = 'var(--color-bg, #0B0B0C)'

/* Choreography clock (seconds). One place, per the house standard. */
const SWEEP_AT = 0.3
const SWEEP_S = 1.6 // first pass — anchors ping as it crosses them
const RESWEEP_S = 2.0
const RESWEEP_EVERY_S = 9 // idle re-sweep cadence, alternating direction
const RESWEEP_AT = SWEEP_AT + SWEEP_S + (RESWEEP_EVERY_S - RESWEEP_S)
const [RETICLE_AT, HOP_AT] = [2.05, 2.6]
const HOP_DWELL_S = 5.4 // reticle locks ~6s per anchor including the move
const [HOP_MOVE_S, TYPE_S] = [0.6, 0.55]
/** Full image width in "cm" for the band readout — plausible, never real data. */
const WIDTH_CM = 66
const READOUT_REST = 'W 00.0'

/* Instrument sizing. These are labels meant to be read at console distance, so
   the annotation scales as ONE object — text, plate, leader reach, dots and
   reticle move together. Big text on small furniture reads as a mistake. */
const CHIP_TRACK = 0.1 // em — large glyphs need far less tracking than small
const CHIP_PAD = 7
const RAIL_INSET = 14
const SCALE = {
  console: { chip: 14, cap: 28, readout: 14, dot: 8, pip: 3.6, reach: 34, stroke: 1.4 },
  sheet: { chip: 12, cap: 24, readout: 12, dot: 7, pip: 3.2, reach: 28, stroke: 1.3 },
} as const

/* Brand face set like an instrument (tabular digits, wide-tracked tags). */
const face = (letterSpacing: string, extra?: CSSProperties): CSSProperties => ({
  fontFamily: 'var(--font-sans, sans-serif)',
  letterSpacing,
  ...extra,
})
const CHIP_STYLE = face(`${CHIP_TRACK}em`)
const VALUE_STYLE = face('0.08em', { fontVariantNumeric: 'tabular-nums' })
const TAG_STYLE = face('0.26em')

/* Anchor recipes: vertical fraction of the garment span, lateral lerp across
   that row's edges, and which side the chip rail sits on. The FALLBACK
   geometry, used for any stat whose marker carries no authored position —
   readings are always the passport's own. Sheet tier runs [0] and [2]. */
const ANCHOR_RECIPES = [
  { fy: 0.16, k: 0.62, side: 1, dy: -18 },
  { fy: 0.48, k: 0.34, side: -1, dy: 8 },
  { fy: 0.8, k: 0.56, side: 1, dy: 20 },
] as const

const RASTER_CAP = 128 // historical raster cap — preserves pre-extraction geometry

/** Per-row silhouette edges + the span the solver reads. `top`/`bottom` are the
 *  first/last opaque row centers (fraction of height). */
interface SpecsEdgeProfile {
  rowCount: number
  rows: ReadonlyArray<SilhouetteRow | null>
  top: number
  bottom: number
  aspect: number
}

/** Shared sample (sparse-checked, so populated rows are guaranteed) → solver shape. */
function toEdgeProfile(sample: SilhouetteSample2D): SpecsEdgeProfile {
  let [first, last] = [-1, -1]
  for (let y = 0; y < sample.rows.length; y += 1) {
    if (!sample.rows[y]) continue
    if (first < 0) first = y
    last = y
  }
  const h = sample.maskHeight
  return { rowCount: h, rows: sample.rows, top: (Math.max(first, 0) + 0.5) / h, bottom: (Math.max(last, 0) + 0.5) / h, aspect: sample.aspect }
}

interface AnchorLayout {
  x: number; y: number
  leaderD: string
  textX: number; textY: number; textAnchor: 'start' | 'end'
  /** Plate behind the chip, wide enough for every reading in the cycle. */
  plateX: number; plateW: number
  /** Settled reading — this rail's own stat, worded as the card words it. */
  text: string
  /** Re-type cycle: own stat first, then the stats no rail could show. */
  readings: readonly string[]
  /** First-sweep crossing fraction — schedules this anchor's ping. */
  ci: number
}
interface SpecsLayout {
  sweepY0: number; sweepY1: number
  anchors: AnchorLayout[]
  /** Null without a profile: the band sweeps blind (no intercepts). */
  rowAt: ((f: number) => { lx: number; rx: number; cm: string } | null) | null
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Nearest non-empty profile row to a garment-span fraction. */
function anchorRow(p: SpecsEdgeProfile, fy: number): number {
  const target = clamp(Math.round((p.top + fy * (p.bottom - p.top)) * p.rowCount - 0.5), 0, p.rowCount - 1)
  for (let d = 0; d < p.rowCount; d += 1) {
    if (target - d >= 0 && p.rows[target - d]) return target - d
    if (target + d < p.rowCount && p.rows[target + d]) return target + d
  }
  return target
}

/** The chip's line, worded exactly as the Specifications card words it. */
const statText = (marker: PassportEffectMarker) => `${marker.label.toUpperCase()} · ${marker.value}`

function buildLayout(profile: SpecsEdgeProfile | null, rect: ContainedMediaRect | null, tier: 'console' | 'sheet', markers: readonly PassportEffectMarker[]): SpecsLayout {
  const R: StageRegion = resolveStageRegion(rect, profile?.aspect, VIEW_W, VIEW_H)
  const sc = SCALE[tier]
  const top = profile ? profile.top : 0.06
  const bottom = profile ? profile.bottom : 0.94
  const sweepY0 = clamp(R.y + top * R.h - 10, 4, VIEW_H - 40)
  const sweepY1 = clamp(R.y + bottom * R.h + 10, sweepY0 + 40, VIEW_H - 4)

  /* One rail per authored stat and no more: an unauthored passport yields no
     anchors at all rather than a chip with nothing true to say. */
  const stats = markers.map(statText)
  const slots = (tier === 'console' ? [0, 1, 2] : [0, 2]).slice(0, stats.length)
  const spare = stats.slice(slots.length)
  /* Plates are large, so walk top-to-bottom against a running floor — two
     rails can never land close enough for their plates to collide. */
  let floorY = 24

  const anchors = slots.map((ri, i) => {
    const recipe = ANCHOR_RECIPES[ri]
    /* An authored marker is the anchor: resolved through the DISPLAYED
       contain-rect, so a point clicked on the sleeve lands on the sleeve at
       any stage size. Without one, the recipe samples the silhouette — the
       old behaviour, and still the only geometry an unplaced stat has. */
    const place = markerPlacement(markers[i])
    let fx = 0.28 + recipe.k * 0.44 // plausible garment interior, no profile
    let fy = top + recipe.fy * (bottom - top)
    if (profile && !place) {
      const row = anchorRow(profile, recipe.fy)
      const edge = profile.rows[row]
      if (edge) fx = edge.left + recipe.k * (edge.right - edge.left)
      fy = (row + 0.5) / profile.rowCount
    }
    const pt = place ? placeOnRegion(place, R) : { x: R.x + fx * R.w, y: R.y + fy * R.h }
    const x = clamp(pt.x, R.x + 6, R.x + R.w - 6)
    const y = clamp(pt.y, R.y + 6, R.y + R.h - 6)
    const side = place ? placementSide(place) : recipe.side
    // A placed chip rides level with its own anchor; the recipes' offsets only
    // exist to spread three chips nobody positioned.
    const ey = clamp(Math.max(y + (place ? 0 : recipe.dy), floorY), 24, VIEW_H - 14)
    floorY = ey + sc.chip * 1.9
    const ex1 = clamp(x + side * sc.reach, 12, VIEW_W - 12)
    /* The chip rides a rail at the stage EDGE rather than sitting beside its
       anchor: text this size grows outward fast, and the edge is the one place
       it cannot run off-stage however long the authored value runs. */
    const railX = side > 0 ? VIEW_W - RAIL_INSET : RAIL_INSET
    // Truncation ("…") is honest — the card beside the image has the stat in full.
    const cycle = [stats[i] ?? '', ...spare.slice(i), ...spare.slice(0, i)].map((t) => (t.length <= sc.cap ? t : `${t.slice(0, sc.cap - 1).trimEnd()}…`))
    const text = cycle[0] ?? ''
    /* Size the plate on the WIDEST reading it will ever hold, so a re-typed
       spare never overflows the frame. SVG text cannot be measured in the
       solver, so approximate: Sora averages ~0.58em per glyph, plus tracking. */
    const plateW = cycle.reduce((m, t) => Math.max(m, t.length * sc.chip * (0.58 + CHIP_TRACK)), 0) + CHIP_PAD * 2
    const plateX = clamp(side > 0 ? railX + CHIP_PAD - plateW : railX - CHIP_PAD, 4, VIEW_W - 4 - plateW)
    return {
      x,
      y,
      leaderD: `M ${x.toFixed(1)} ${y.toFixed(1)} L ${ex1.toFixed(1)} ${ey.toFixed(1)} L ${railX.toFixed(1)} ${ey.toFixed(1)}`,
      textX: side > 0 ? plateX + plateW - CHIP_PAD : plateX + CHIP_PAD,
      textY: ey - CHIP_PAD,
      textAnchor: (side > 0 ? 'end' : 'start') as 'start' | 'end',
      plateX,
      plateW,
      text,
      readings: cycle, // rotated per rail, so no two chips re-read the same spare at once
      ci: clamp((y - sweepY0) / (sweepY1 - sweepY0), 0.05, 0.95),
    }
  })

  const rowAt = profile
    ? (f: number) => {
        const fy = (sweepY0 + f * (sweepY1 - sweepY0) - R.y) / R.h
        const idx = Math.floor(fy * profile.rowCount)
        if (idx < 0 || idx >= profile.rowCount) return null
        const edge = profile.rows[idx]
        if (!edge) return null
        return { lx: R.x + edge.left * R.w, rx: R.x + edge.right * R.w, cm: ((edge.right - edge.left) * WIDTH_CM).toFixed(1) }
      }
    : null

  return { sweepY0, sweepY1, anchors, rowAt }
}

type ProfileState = SpecsEdgeProfile | 'pending' | null

/** Stable empty list so the layout memo does not churn on every render. */
const NO_MARKERS: readonly PassportEffectMarker[] = []

export default function EffectSpecs({ imageUrl, facts, tier }: PassportEffectProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const isConsole = tier === 'console'
  const sc = SCALE[tier]

  /* The chips ARE the Specifications card's stats — the whole marker goes to
     the solver, position included, so a chip lands where the editor pointed.
     No authored stats ⇒ an empty list ⇒ no anchors at all: an invented spec is
     worse than a missing one. */
  const specs = facts?.specs ?? NO_MARKERS

  // The product <img> is a SIBLING subtree (the effect layer overlays the
  // stage), so the measured box is the layer's parent — the stage itself.
  const setRoot = useCallback((el: SVGSVGElement | null) => {
    svgRef.current = el
    const stage = el ? (el.closest('[data-pp-effect]')?.parentElement ?? el.parentElement) : null
    stageRef.current = stage as HTMLElement | null
  }, [])
  const mediaRect = useContainedMediaRect(stageRef, 'img')

  const [profile, setProfile] = useState<ProfileState>(imageUrl ? 'pending' : null)
  useEffect(() => {
    if (!imageUrl) {
      setProfile(null)
      return
    }
    let cancelled = false
    setProfile('pending')
    // The shared sampler resolves null on any failure — the fallback layout.
    void sampleSilhouette2D(imageUrl, { rasterCap: RASTER_CAP }).then(
      (s) => void (cancelled || setProfile(s ? toEdgeProfile(s) : null)),
    )
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  /* Null while the sample is pending — the animation waits for real geometry
     rather than booting twice. The markup renders the fallback layout in the
     meantime (authored at rest, so a pending beat just shows the still). */
  const layout = useMemo(() => (profile === 'pending' ? null : buildLayout(profile, mediaRect, tier, specs)), [profile, mediaRect, tier, specs])
  const shown = useMemo(() => layout ?? buildLayout(null, mediaRect, tier, specs), [layout, mediaRect, tier, specs])

  useGSAP(
    () => {
      const svg = svgRef.current
      /* Reduced motion (and pending) ⇒ the authored still: anchors lit,
         chips typed, band and pings hidden, reticle parked. Zero GSAP. */
      if (!svg || reducedMotion || !layout) return

      const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)
      const all = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel))
      const band = one<SVGGElement>('[data-sa="band"]')
      const live = one<SVGGElement>('[data-sa="band-live"]')
      const seg = one<SVGLineElement>('[data-sa="band-seg"]')
      const dotL = one<SVGCircleElement>('[data-sa="edge-l"]')
      const dotR = one<SVGCircleElement>('[data-sa="edge-r"]')
      const readout = one<SVGTextElement>('[data-sa="readout"]')
      const reticle = one<SVGGElement>('[data-sa="reticle"]')
      const spin = one<SVGGElement>('[data-sa="reticle-spin"]')
      const statusDot = one<SVGCircleElement>('[data-sa="status-dot"]')
      const anchorEls = all<SVGGElement>('[data-sa="anchor"]')
      const pings = all<SVGCircleElement>('[data-sa="ping"]')
      const leaders = all<SVGPathElement>('[data-sa="leader"]')
      const boxes = all<SVGGElement>('[data-sa="chipbox"]')
      const chips = all<SVGTextElement>('[data-sa="chip"]')
      // Only the band is required: with no stats there are no chips and no
      // reticle, and the shape-reading half must still run.
      if (!band || !live || !seg || !dotL || !dotR) return

      const settled = chips.map((el) => el.textContent ?? '')
      const counts = layout.anchors.map(() => 0)
      const sweep = { f: 0 }

      /* Per-frame band registration: position the band, then let it REACT to the
         silhouette — intercepts snap to this row's edges, readout ticks the
         width. Direct attribute writes (no React, no layout reads). */
      const place = () => {
        const y = layout.sweepY0 + sweep.f * (layout.sweepY1 - layout.sweepY0)
        band.setAttribute('transform', `translate(0 ${y.toFixed(2)})`)
        const row = layout.rowAt ? layout.rowAt(sweep.f) : null
        live.setAttribute('opacity', row ? '1' : '0')
        if (!row) return
        seg.setAttribute('x1', row.lx.toFixed(1))
        seg.setAttribute('x2', row.rx.toFixed(1))
        dotL.setAttribute('cx', row.lx.toFixed(1))
        dotR.setAttribute('cx', row.rx.toFixed(1))
        if (readout) {
          readout.setAttribute('x', Math.min(row.rx + 10, 316).toFixed(1))
          readout.textContent = `W ${row.cm}`
        }
      }

      /* Typewriter on a proxy — target resolved at play time, so the hop loop's
         repeats advance through the spare readings. */
      const typeInto = (el: SVGTextElement, pick: () => string) => {
        const proxy = { t: 0 }
        let target = ''
        return gsap.to(proxy, {
          t: 1,
          duration: TYPE_S,
          ease: 'none',
          onStart: () => void (target = pick()),
          onUpdate: () => void (el.textContent = target.slice(0, Math.round(proxy.t * target.length))),
        })
      }

      const tl = gsap.timeline()
      const spinTo = { rotation: 360, duration: 3.2, repeat: -1, ease: 'none', transformOrigin: '0px 0px' }
      const blinkTo = { opacity: 0.3, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' }

      // Always-alive layer: reticle rotation + status pulse never stop.
      if (spin) tl.fromTo(spin, { rotation: 0 }, spinTo, 0)
      if (statusDot) tl.fromTo(statusDot, { opacity: 1 }, blinkTo, 0)

      // First pass: linear, so each anchor's crossing time is exactly ci.
      tl.fromTo(band, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' }, SWEEP_AT - 0.15)
      tl.fromTo(sweep, { f: 0 }, { f: 1, duration: SWEEP_S, ease: 'none', onUpdate: place }, SWEEP_AT)
      tl.to(band, { opacity: 0, duration: 0.35, ease: 'power1.out' }, SWEEP_AT + SWEEP_S)

      // Anchors ping AS the band crosses their row — the scanner finding them.
      layout.anchors.forEach((a, i) => {
        const [anchorEl, ping, leader, box, chip] = [anchorEls[i], pings[i], leaders[i], boxes[i], chips[i]]
        if (!anchorEl || !ping || !leader || !box || !chip) return
        const at = SWEEP_AT + a.ci * SWEEP_S
        tl.fromTo(anchorEl, { scale: 0, transformOrigin: '0px 0px' }, { scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, at)
        tl.fromTo(ping, { attr: { r: sc.dot * 0.55 }, opacity: 0.75 }, { attr: { r: sc.dot * 3.2 }, opacity: 0, duration: 0.6, ease: 'power2.out' }, at)
        tl.fromTo(leader, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, at + 0.08)
        tl.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power1.out' }, at + 0.28)
        tl.add(typeInto(chip, () => a.text), at + 0.3)
      })

      /* The reticle locks onto the first anchor, then hops forever; the chip it
         leaves re-types with the next SPARE stat (or re-reads its own when the
         passport has none) — never finished, never invented. */
      if (reticle) {
        tl.fromTo(reticle, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, RETICLE_AT)
        if (layout.anchors.length > 1) {
          const hop = gsap.timeline({ repeat: -1 })
          let t = 0
          layout.anchors.forEach((a, k) => {
            const next = layout.anchors[(k + 1) % layout.anchors.length]
            if (!next) return
            hop.to(reticle, { x: next.x, y: next.y, duration: HOP_MOVE_S, ease: 'power2.inOut' }, t + HOP_DWELL_S)
            const chip = chips[k]
            const retype = () => {
              counts[k] = (counts[k] ?? 0) + 1
              return a.readings[(counts[k] ?? 0) % a.readings.length] ?? ''
            }
            if (chip) hop.add(typeInto(chip, retype), t + HOP_DWELL_S + 0.2)
            t += HOP_DWELL_S + HOP_MOVE_S
          })
          tl.add(hop, HOP_AT)
        }
      }

      // Idle re-sweeps, alternating direction, intercepts flaring again.
      const loop = gsap.timeline({ repeat: -1 })
      const leg = (at: number, from: number, to: number) => {
        const sweepTo = { f: to, duration: RESWEEP_S, ease: 'sine.inOut', onUpdate: place, immediateRender: false }
        loop.to(band, { opacity: 1, duration: 0.25, ease: 'power1.out' }, at)
        loop.fromTo(sweep, { f: from }, sweepTo, at + 0.05)
        loop.to(band, { opacity: 0, duration: 0.4, ease: 'power1.out' }, at + RESWEEP_S)
      }
      leg(0, 1, 0)
      leg(RESWEEP_EVERY_S, 0, 1)
      loop.to({}, { duration: 0.001 }, RESWEEP_EVERY_S * 2 - 0.001) // hold the cadence
      tl.add(loop, RESWEEP_AT)

      /* GSAP's revert restores styles/attrs it tweened but not textContent —
         put the settled readings back if torn down mid-type. */
      return () => {
        chips.forEach((el, i) => void (el.textContent = settled[i] ?? ''))
        if (readout) readout.textContent = READOUT_REST
      }
    },
    { scope: svgRef, dependencies: [reducedMotion, layout] },
  )

  const first = shown.anchors[0]

  return (
    <svg
      ref={setRoot}
      data-passport-effect="specs"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      /* Both hosts pin the stage to 4:5, so `none` keeps units square while
         guaranteeing the geometry spans the box exactly. */
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
    >
      {/* The scan band — transient by nature, authored hidden. `band-live` is the
          shape-aware part (intercepts + readout), raised per-frame only over a
          real silhouette row. It reads geometry, so it runs without any stats. */}
      <g data-sa="band" opacity={0} transform={`translate(0 ${shown.sweepY0.toFixed(2)})`}>
        <line x1={8} y1={0} x2={VIEW_W - 8} y2={0} stroke={BONE} strokeOpacity={0.16} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <g data-sa="band-live" opacity={0}>
          <line data-sa="band-seg" x1={120} y1={0} x2={280} y2={0} stroke={CHAMPAGNE} strokeOpacity={0.9} strokeWidth={sc.stroke + 0.3} vectorEffect="non-scaling-stroke" />
          <circle data-sa="edge-l" cx={120} cy={0} r={sc.pip} fill={CHAMPAGNE} />
          <circle data-sa="edge-r" cx={280} cy={0} r={sc.pip} fill={CHAMPAGNE} />
          {isConsole ? (
            <text data-sa="readout" x={288} y={-9} fontSize={sc.readout} fill={BONE} fillOpacity={0.9} style={VALUE_STYLE}>
              {READOUT_REST}
            </text>
          ) : null}
        </g>
      </g>

      {/* Anchors on the garment, leaders out to the plated chips. */}
      {shown.anchors.map((a, i) => (
        <g key={`${a.text}-${i}`}>
          <path data-sa="leader" d={a.leaderD} pathLength={1} fill="none" stroke={BONE} strokeOpacity={0.5} strokeWidth={sc.stroke} strokeDasharray={1} strokeDashoffset={0} vectorEffect="non-scaling-stroke" />
          <g data-sa="anchor" transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}>
            <circle r={sc.dot} fill="none" stroke={BONE} strokeOpacity={0.4} strokeWidth={sc.stroke} vectorEffect="non-scaling-stroke" />
            <circle r={sc.pip} fill={CHAMPAGNE} />
          </g>
          <circle data-sa="ping" cx={a.x} cy={a.y} r={sc.dot} fill="none" stroke={CHAMPAGNE} strokeWidth={sc.stroke} opacity={0} vectorEffect="non-scaling-stroke" />
          <g data-sa="chipbox">
            <rect x={a.plateX} y={a.textY - sc.chip * 0.94} width={a.plateW} height={sc.chip * 1.32} rx={3} fill={PLATE} fillOpacity={0.45} />
            <text data-sa="chip" x={a.textX} y={a.textY} textAnchor={a.textAnchor} fontSize={sc.chip} fill={BONE} fillOpacity={0.95} style={CHIP_STYLE}>
              {a.text}
            </text>
          </g>
        </g>
      ))}

      {/* The orbiting reticle — parked on the first anchor at rest. */}
      {first ? (
        <g data-sa="reticle" transform={`translate(${first.x.toFixed(1)} ${first.y.toFixed(1)})`}>
          <g data-sa="reticle-spin">
            <circle r={sc.dot * 2.4} fill="none" stroke={CHAMPAGNE} strokeOpacity={0.85} strokeWidth={sc.stroke} strokeDasharray="9 5" vectorEffect="non-scaling-stroke" />
            {[45, 135, 225, 315].map((deg) => (
              <line key={deg} x1={0} y1={-sc.dot * 3.1} x2={0} y2={-sc.dot * 2.1} transform={`rotate(${deg})`} stroke={BONE} strokeOpacity={0.55} strokeWidth={sc.stroke} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </g>
      ) : null}

      {/* Instrument tag — the theme-legibility anchor (console only). */}
      {isConsole ? (
        <g data-sa="status">
          <circle data-sa="status-dot" cx={18} cy={20} r={3} fill={CHAMPAGNE} />
          <text x={29} y={24} fontSize={10} fill={BONE} fillOpacity={0.75} style={TAG_STYLE}>
            LIVE · ANALYSIS
          </text>
        </g>
      ) : null}
    </svg>
  )
}
