import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { useContainedMediaRect, type ContainedMediaRect } from '@/shared/hooks/useContainedMediaRect'
import type { PassportEffectProps } from '../effectTypes'
import { sampleSilhouette2D, type SilhouetteSample2D } from '../lib/silhouette2d'

/**
 * Origin — "The Journey to This Piece".
 *
 * Cartography that lands on the garment. The globe-corner graticule settles
 * in BEHIND the piece — a luminance mask cut from the real sampled outline
 * fades every meridian/parallel where it would cross the silhouette, so the
 * garment stands in front of the chart. One dashed course enters off-stage,
 * sweeps the chart, arcs over an apex and descends onto the piece itself,
 * terminating at a REAL sampled point on the upper chest (centroid.x at ~31%
 * down the occupied silhouette rows — where a crest would sit). The pin lands
 * there with a pop; champagne pulse rings emanate from that point, with the
 * `N 33.8°` latitude whisper beside it. Waypoint lights ignite as the route
 * head passes, then twinkle forever; every ~8s a range-finder ring surveys
 * out from the pin (soft-faded over the silhouette) and the corner compass
 * re-seeks north. The photo is never covered — the chart yields to the piece.
 *
 * Shape truth: `../lib/silhouette2d` — NEVER `@/shared/webgl/particleShapes`
 * (its top-level three.js import would drag `vendor-three` into this lazy
 * chunk; docs/animation-guidelines.md "Passport section effects"). The
 * product <img> is a SIBLING of this layer, so image-box coordinates map
 * through the displayed object-contain rect (`useContainedMediaRect`) into
 * the 400x500 stage viewBox exactly as EffectSpecs does; `non-scaling-stroke`
 * keeps hairlines 1px under the stretched (`preserveAspectRatio="none"`) box.
 *
 * Degradation: sample null → the classic fixed layout (upper-right pin, FULL
 * graticule, route + life intact). Reduced motion → an authored STILL
 * (attributes, zero GSAP): route fully drawn, pin + one resting ring +
 * latitude label, occluded graticule when the sample exists, no twinkle/ping.
 * A pending decode shows the fallback still until geometry lands. SVG+GSAP —
 * no canvas, so no DPR concern; the GSAP ticker parks on hidden tabs itself.
 *
 * Over the 300-line soft limit deliberately: the effect seam confines layout
 * solver (region/pin/route spline), choreography and authored-at-rest markup
 * to this one file (EffectSpecs' dispensation).
 */

/* 4:5 stage space — both host tiers render a 4:5 box, so units are square. */
const [VIEW_W, VIEW_H] = [400, 500]

/* Theme tokens; literal fallbacks are oath-dark so jsdom/SSR draw on-brand. */
const BONE = 'var(--color-heading, #E7E4DF)'
const MUTED = 'var(--color-text-muted, #bab8b3)'
const LINE = 'var(--color-line, rgba(231, 228, 223, 0.14))'
const CHAMPAGNE = 'var(--color-highlight-bright, #e08a4a)'

/* Choreography clock (seconds) — one place, per the house standard. */
const GRATICULE_IN_S = 0.9
const ROUTE_AT_S = 0.5
const ROUTE_DRAW_S = 2 // linear draw, so a waypoint's ignition time is exactly f
const LAND_AT_S = ROUTE_AT_S + ROUTE_DRAW_S - 0.15 // pin lands as the course arrives
const RING_EVERY_S = 3.2 // pulse-ring heartbeat out of the pin
const RING_TRAVEL_S = 1.6
const SURVEY_EVERY_S = 8 // range-finder ping cadence (console only)
const SURVEY_SWEEP_S = 2.4
const SURVEY_AT_S = LAND_AT_S + 1.2
const TWINKLE_S = 2.4
/** Upper-chest row: fraction down the occupied silhouette rows (28–35% band). */
const PIN_ROW_F = 0.31

/** 5 meridians leaning right + 3 crowned parallels — a globe's corner. */
const LONGITUDES = [
  'M -14 468 C 84 332, 148 178, 146 -12',
  'M 58 502 C 158 352, 218 190, 212 -12',
  'M 138 510 C 238 368, 294 208, 284 -12',
  'M 226 512 C 318 388, 362 238, 352 -8',
  'M 316 512 C 386 408, 412 298, 408 148',
]
const LATITUDES = [
  'M -12 148 C 118 108, 282 104, 412 138',
  'M -12 288 C 128 244, 288 240, 412 278',
  'M -12 418 C 138 368, 298 364, 412 408',
]

/** Compass whisper seat — lower-left corner, out of the garment's way. */
const COMPASS = { x: 52, y: 434 }
/** Thin 4-point star (N/S/E/W spikes, tight waist) centered on COMPASS. */
const COMPASS_STAR_D = 'M 52 414 L 56 430 L 72 434 L 56 438 L 52 454 L 48 438 L 32 434 L 48 430 Z'

/** Classic fixed pin — the designed fallback when no silhouette exists. */
const FALLBACK_PIN = { x: 296, y: 118 }
/** Route arc-length fractions where the waypoint lights sit, per tier. */
const WAYPOINT_F = { console: [0.14, 0.3, 0.46, 0.62, 0.8], sheet: [0.18, 0.45, 0.72] }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface Pt { x: number; y: number }
/** Where the displayed image sits, in viewBox units. */
interface Region { x: number; y: number; w: number; h: number }

/* No image knowledge at all: the classic garment inset of the 4:5 stage. */
const DEFAULT_REGION: Region = { x: 52, y: 65, w: 296, h: 370 }

/** Measured contain-rect → viewBox units (box size recovered from centering). */
function regionFromRect(rect: ContainedMediaRect | null): Region | null {
  if (!rect) return null
  const boxW = rect.width + rect.left * 2
  const boxH = rect.height + rect.top * 2
  if (boxW < 2 || boxH < 2) return null
  // The hook's "no media found / not decoded" fallback IS the full box —
  // indistinguishable from a genuine aspect match, so let aspect math decide.
  if (rect.left < 1 && rect.top < 1) return null
  const [sx, sy] = [VIEW_W / boxW, VIEW_H / boxH]
  return { x: rect.left * sx, y: rect.top * sy, w: rect.width * sx, h: rect.height * sy }
}

/** Contain math from the sampled image's aspect (stage is 4:5 by contract). */
function regionFromAspect(aspect: number | undefined): Region | null {
  if (!aspect || !Number.isFinite(aspect) || aspect <= 0) return null
  const s = Math.min(VIEW_W / aspect, VIEW_H)
  return { x: (VIEW_W - aspect * s) / 2, y: (VIEW_H - s) / 2, w: aspect * s, h: s }
}

/** The crest point: centroid.x on the row ~PIN_ROW_F down the occupied span. */
function pinFromSample(sample: SilhouetteSample2D, R: Region): Pt {
  let first = -1
  let last = -1
  for (let y = 0; y < sample.rows.length; y += 1) {
    if (!sample.rows[y]) continue
    if (first < 0) first = y
    last = y
  }
  if (first < 0 || last <= first) return FALLBACK_PIN
  const target = Math.round(first + PIN_ROW_F * (last - first))
  let row = target
  for (let d = 0; d < sample.rows.length; d += 1) {
    if (target - d >= 0 && sample.rows[target - d]) { row = target - d; break }
    if (target + d < sample.rows.length && sample.rows[target + d]) { row = target + d; break }
  }
  const edge = sample.rows[row]
  const fx = edge
    ? clamp(sample.centroid.x, edge.left + 0.1 * (edge.right - edge.left), edge.right - 0.1 * (edge.right - edge.left))
    : sample.centroid.x
  return { x: R.x + fx * R.w, y: R.y + ((row + 0.5) / sample.rows.length) * R.h }
}

const cubicAt = (a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t
  const [w0, w1, w2, w3] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
  return { x: w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x, y: w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y }
}

/**
 * The course home: enters off-stage left, sweeps the chart, arcs over an apex
 * and descends onto the pin. A Catmull-Rom spline through knots derived from
 * the pin keeps the shape language stable wherever the garment puts it; the
 * same cubics are polyline-sampled so waypoints sit at true arc-length
 * fractions (`at`) — no `getTotalLength()`, which jsdom lacks.
 */
function buildRoute(pin: Pt): { d: string; at: (f: number) => Pt } {
  const side = pin.x + 128 <= VIEW_W - 14 ? 1 : -1 // approach apex flips near the edge
  const entryY = clamp(pin.y + 236, 320, VIEW_H - 24)
  const knots: Pt[] = [
    { x: -16, y: entryY },
    { x: 72, y: entryY - 58 },
    { x: side > 0 ? 176 : 124, y: clamp(pin.y + 68, 150, 424) },
    { x: clamp(pin.x + side * 118, 20, VIEW_W - 14), y: Math.max(pin.y - 108, 30) },
    pin,
  ]
  const p = [knots[0], ...knots, knots[knots.length - 1]]
  let d = `M ${knots[0].x.toFixed(1)} ${knots[0].y.toFixed(1)}`
  const poly: Pt[] = [knots[0]]
  for (let i = 1; i < p.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    for (let s = 1; s <= 16; s += 1) poly.push(cubicAt(p1, c1, c2, p2, s / 16))
  }
  const cum = new Array<number>(poly.length).fill(0)
  for (let i = 1; i < poly.length; i += 1) {
    cum[i] = cum[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y)
  }
  const total = cum[cum.length - 1]
  const at = (f: number): Pt => {
    if (total <= 0) return poly[0]
    const target = clamp(f, 0, 1) * total
    let i = 1
    while (i < cum.length - 1 && cum[i] < target) i += 1
    const fr = cum[i] - cum[i - 1] > 0 ? (target - cum[i - 1]) / (cum[i] - cum[i - 1]) : 0
    return { x: poly[i - 1].x + (poly[i].x - poly[i - 1].x) * fr, y: poly[i - 1].y + (poly[i].y - poly[i - 1].y) * fr }
  }
  return { d, at }
}

interface OriginLayout {
  pin: Pt
  routeD: string
  waypoints: Array<Pt & { f: number }>
  /** Silhouette polygon in viewBox units — null = no occlusion (fallback). */
  occlusionPoints: string | null
  /** Side of the pin the latitude whisper sits (away from the approach). */
  textSide: 1 | -1
}

function buildLayout(
  sample: SilhouetteSample2D | null,
  rect: ContainedMediaRect | null,
  tier: 'console' | 'sheet',
): OriginLayout {
  const R = regionFromRect(rect) ?? regionFromAspect(sample?.aspect) ?? DEFAULT_REGION
  const pin = sample ? pinFromSample(sample, R) : FALLBACK_PIN
  const { d, at } = buildRoute(pin)
  const occlusionPoints = sample
    ? sample.outline.map((o) => `${(R.x + o.x * R.w).toFixed(1)},${(R.y + o.y * R.h).toFixed(1)}`).join(' ')
    : null
  return {
    pin,
    routeD: d,
    waypoints: WAYPOINT_F[tier].map((f) => ({ ...at(f), f })),
    occlusionPoints,
    textSide: pin.x + 128 <= VIEW_W - 14 ? -1 : 1,
  }
}

type ShapeState = SilhouetteSample2D | 'pending' | null

export default function EffectOrigin({ imageUrl, tier }: PassportEffectProps) {
  const still = useReducedMotion()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const isConsole = tier === 'console'

  // The product <img> is a SIBLING subtree (the effect layer overlays the
  // stage), so the measured box is the layer's parent — the stage itself.
  const setRoot = useCallback((el: SVGSVGElement | null) => {
    svgRef.current = el
    const stage = el ? (el.closest('[data-pp-effect]')?.parentElement ?? el.parentElement) : null
    stageRef.current = stage as HTMLElement | null
  }, [])
  const mediaRect = useContainedMediaRect(stageRef, 'img')

  const [shape, setShape] = useState<ShapeState>(imageUrl ? 'pending' : null)
  useEffect(() => {
    if (!imageUrl) {
      setShape(null)
      return
    }
    let cancelled = false
    setShape('pending')
    // The shared sampler resolves null on any failure — the designed fallback.
    void sampleSilhouette2D(imageUrl, { outlinePoints: 128 }).then(
      (s) => void (cancelled || setShape(s)),
    )
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  /* Null while the sample is pending — the journey waits for real geometry
     rather than booting twice; the markup shows the fallback still meanwhile. */
  const layout = useMemo(
    () => (shape === 'pending' ? null : buildLayout(shape, mediaRect, tier)),
    [shape, mediaRect, tier],
  )
  const shown = useMemo(() => layout ?? buildLayout(null, mediaRect, tier), [layout, mediaRect, tier])
  /* Authored-at-rest attributes engage for the still AND the pending beat. */
  const rest = still || layout === null

  // useId can emit chars that break `url(#...)` references — strip to a slug.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [drawId, occlId, surveyId] = [`oe-draw-${uid}`, `oe-occl-${uid}`, `oe-soft-${uid}`]
  const occl = shown.occlusionPoints

  useGSAP(
    () => {
      const root = svgRef.current
      if (!root || still || !layout) return
      const one = (key: string) => root.querySelector(`[data-oe="${key}"]`)
      const all = (key: string) => Array.from(root.querySelectorAll(`[data-oe="${key}"]`))
      const [grat, draw, pin, land] = [one('graticule'), one('route-draw'), one('pin'), one('land-ring')]
      const [survey, compass, needle] = [one('survey'), one('compass'), one('needle')]
      const rings = all('ring-pulse')
      const waypoints = all('waypoint')
      const pinOrigin = `${layout.pin.x} ${layout.pin.y}`
      const seat = `${COMPASS.x} ${COMPASS.y}`

      // Entrance: chart in, the course draws (linear — the ignition math
      // relies on it), waypoints ignite under the head, the pin lands.
      const tl = gsap.timeline()
      if (grat) tl.fromTo(grat, { opacity: 0 }, { opacity: 1, duration: GRATICULE_IN_S, ease: 'sine.out' }, 0)
      if (compass) tl.fromTo(compass, { opacity: 0 }, { opacity: 1, duration: 1, ease: 'sine.out' }, 0.4)
      if (draw) tl.fromTo(draw, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: ROUTE_DRAW_S, ease: 'none' }, ROUTE_AT_S)
      waypoints.forEach((el, i) => {
        const wp = layout.waypoints[i]
        if (!wp) return
        const pop = { opacity: 0.85, scale: 1, svgOrigin: `${wp.x} ${wp.y}`, duration: 0.5, ease: 'back.out(2.4)' }
        tl.fromTo(el, { opacity: 0, scale: 0.2 }, pop, ROUTE_AT_S + wp.f * ROUTE_DRAW_S)
      })
      if (pin) tl.fromTo(pin, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, svgOrigin: pinOrigin, duration: 0.55, ease: 'back.out(2.2)' }, LAND_AT_S)
      if (land) tl.fromTo(land, { attr: { r: 4 }, opacity: 0.8 }, { attr: { r: 26 }, opacity: 0, duration: 0.7, ease: 'power2.out' }, LAND_AT_S)

      // Continuous life. Pulse rings emanate from the real pin point forever…
      rings.forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0.7, scale: 0.3 }, {
          opacity: 0, scale: 3.4, svgOrigin: pinOrigin, duration: RING_TRAVEL_S, ease: 'sine.out',
          repeat: -1, repeatDelay: RING_EVERY_S - RING_TRAVEL_S,
          delay: LAND_AT_S + 0.5 + i * (RING_EVERY_S / 2), immediateRender: false,
        })
      })
      // …the waypoint lights twinkle…
      if (waypoints.length > 0) {
        gsap.to(waypoints, {
          opacity: 0.35, duration: TWINKLE_S, ease: 'sine.inOut', yoyo: true, repeat: -1,
          delay: ROUTE_AT_S + ROUTE_DRAW_S + 0.5, stagger: { each: 0.5, from: 'random' },
        })
      }
      // …and every SURVEY_EVERY_S a range-finder ring surveys out of the pin.
      if (survey) {
        gsap.fromTo(survey, { opacity: 0.5, scale: 0.2 }, {
          opacity: 0, scale: 5.2, svgOrigin: pinOrigin, duration: SURVEY_SWEEP_S, ease: 'sine.out',
          repeat: -1, repeatDelay: SURVEY_EVERY_S - SURVEY_SWEEP_S, delay: SURVEY_AT_S, immediateRender: false,
        })
      }
      // The needle finds north once, then re-seeks on the survey clock — each
      // ping unsettles it and it damps back to rest before the next.
      if (needle) {
        gsap.timeline({ delay: 1.1 })
          .fromTo(needle, { rotation: -8 }, { rotation: 3, svgOrigin: seat, duration: 1.3, ease: 'sine.inOut' })
          .to(needle, { rotation: 0, duration: 1, ease: 'sine.out' })
        gsap.timeline({ repeat: -1, delay: SURVEY_AT_S + 0.25 })
          .fromTo(needle, { rotation: 0 }, { rotation: -7, svgOrigin: seat, duration: 0.9, ease: 'sine.inOut' })
          .to(needle, { rotation: 4, duration: 1.3, ease: 'sine.inOut' })
          .to(needle, { rotation: -1.5, duration: 1.1, ease: 'sine.inOut' })
          .to(needle, { rotation: 0, duration: 0.9, ease: 'sine.out' })
          .to({}, { duration: SURVEY_EVERY_S - 4.2 })
      }
    },
    // revertOnUpdate: a live reduced-motion flip (or the sample landing) must
    // strip GSAP's inline styles so the attribute-authored state takes over.
    { scope: svgRef, dependencies: [still, layout], revertOnUpdate: true },
  )

  const coordsX = clamp(shown.pin.x + shown.textSide * 15, 16, VIEW_W - 16)

  return (
    <svg
      ref={setRoot}
      data-passport-effect="origin"
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      /* Both hosts pin the stage to 4:5, so `none` keeps units square while
         guaranteeing silhouette registration spans the box exactly. */
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        {/* Draw-on reveal: a solid pathLength=1 copy masks the dashed course —
            tweening the dashed path's own offset would slide its dashes. */}
        <mask id={drawId} maskUnits="userSpaceOnUse" x={-20} y={-20} width={VIEW_W + 40} height={VIEW_H + 40}>
          <path data-oe="route-draw" d={shown.routeD} pathLength={1} fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={rest ? 0 : 1} />
        </mask>
        {occl ? (
          <>
            {/* The piece occludes the chart: near-black silhouette luminance
                kills the graticule behind the garment; the gray rim melts the
                edge so the fade reads soft, not die-cut. */}
            <mask id={occlId} maskUnits="userSpaceOnUse" x={-20} y={-20} width={VIEW_W + 40} height={VIEW_H + 40}>
              <rect x={-20} y={-20} width={VIEW_W + 40} height={VIEW_H + 40} fill="#ffffff" />
              <polygon data-oe="occl-poly" points={occl} fill="#101010" stroke="#4a4a4a" strokeWidth={7} strokeLinejoin="round" />
            </mask>
            {/* Softer cut for the survey ring — it FADES over the silhouette
                (~35%) instead of vanishing, since it is born on the pin. */}
            <mask id={surveyId} maskUnits="userSpaceOnUse" x={-20} y={-20} width={VIEW_W + 40} height={VIEW_H + 40}>
              <rect x={-20} y={-20} width={VIEW_W + 40} height={VIEW_H + 40} fill="#ffffff" />
              <polygon points={occl} fill="#5a5a5a" />
            </mask>
          </>
        ) : null}
      </defs>

      {/* The chart, wrapping BEHIND the piece when the silhouette is known. */}
      <g data-oe="graticule" opacity={rest ? 1 : 0} mask={occl ? `url(#${occlId})` : undefined}>
        {[...LONGITUDES, ...LATITUDES].map((d) => (
          <path key={d} d={d} fill="none" stroke={BONE} strokeOpacity={0.16} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      {/* The survey: a range-finder ring off the pin, faded over the piece. */}
      {isConsole && !still ? (
        <g mask={occl ? `url(#${surveyId})` : undefined}>
          <circle data-oe="survey" cx={shown.pin.x} cy={shown.pin.y} r={16} fill="none" stroke={CHAMPAGNE} strokeWidth={1.1} strokeDasharray="30 14" opacity={0} vectorEffect="non-scaling-stroke" />
        </g>
      ) : null}

      {/* The course to this piece — dashed, revealed by the draw mask. */}
      <path data-oe="route" d={shown.routeD} fill="none" stroke={BONE} strokeOpacity={0.7} strokeWidth={1.6} strokeDasharray="5 7" strokeLinecap="round" mask={`url(#${drawId})`} vectorEffect="non-scaling-stroke" />

      {/* Waypoint lights along the course — ignited by the passing head. */}
      {shown.waypoints.map((wp) => (
        <circle key={wp.f} data-oe="waypoint" cx={wp.x} cy={wp.y} r={1.9} fill={BONE} opacity={rest ? 0.55 : 0} />
      ))}

      {/* The pin, landed ON the piece — the one warm point everything defers to. */}
      <g data-oe="pin" opacity={rest ? 1 : 0}>
        <circle cx={shown.pin.x} cy={shown.pin.y} r={10} fill={CHAMPAGNE} opacity={0.22} />
        <circle cx={shown.pin.x} cy={shown.pin.y} r={4} fill={CHAMPAGNE} />
        <circle cx={shown.pin.x} cy={shown.pin.y} r={1.4} fill={BONE} opacity={0.9} />
        {/* Latitude whisper — Lebanon's parallel, beside the landing. */}
        <text data-oe="coords" x={coordsX} y={shown.pin.y + 3.5} textAnchor={shown.textSide > 0 ? 'start' : 'end'} fontSize={10} letterSpacing="0.14em" fontFamily="var(--font-sans, sans-serif)" fill={CHAMPAGNE} opacity={0.75}>
          N 33.8°
        </text>
      </g>

      {still ? (
        // Reduced motion: one resting ring stands in for every animated
        // emitter — present, never animated.
        <circle data-oe="ring-static" cx={shown.pin.x} cy={shown.pin.y} r={12} fill="none" stroke={CHAMPAGNE} strokeOpacity={0.5} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      ) : (
        <>
          <circle data-oe="land-ring" cx={shown.pin.x} cy={shown.pin.y} r={4} fill="none" stroke={CHAMPAGNE} strokeWidth={1.4} opacity={0} vectorEffect="non-scaling-stroke" />
          {Array.from({ length: isConsole ? 2 : 1 }, (_, i) => (
            <circle key={i} data-oe="ring-pulse" cx={shown.pin.x} cy={shown.pin.y} r={7} fill="none" stroke={CHAMPAGNE} strokeWidth={1.4} opacity={0} vectorEffect="non-scaling-stroke" />
          ))}
        </>
      )}

      {/* Compass whisper — the needle group sways; the seat dot stays put. */}
      <g data-oe="compass" opacity={rest ? 1 : 0}>
        <g data-oe="needle">
          <path d={COMPASS_STAR_D} fill="none" stroke={LINE} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          {/* Firmer north spike, so the settle reads as "finding north". */}
          <path d={`M ${COMPASS.x} ${COMPASS.y - 20} L ${COMPASS.x} ${COMPASS.y - 12}`} stroke={MUTED} strokeOpacity={0.7} strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
        <circle cx={COMPASS.x} cy={COMPASS.y} r={1} fill={MUTED} opacity={0.7} />
      </g>
    </svg>
  )
}
