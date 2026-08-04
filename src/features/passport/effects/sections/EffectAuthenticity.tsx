import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { useContainedMediaRect, type ContainedMediaRect } from '@/shared/hooks/useContainedMediaRect'
import type { PassportEffectProps } from '../effectTypes'
import {
  sampleSilhouette2D,
  type SilhouettePoint,
  type SilhouetteRow,
  type SilhouetteSample2D,
} from '../lib/silhouette2d'

/**
 * Authenticity — "The Piece Verified".
 *
 * The verification reads THIS garment, not the stage. A rite in three beats,
 * then a living idle: (1) THE READ — a beam sweeps the piece, bright only
 * between each raster row's real silhouette intercepts, edge glints riding
 * the intercepts; (2) THE VALIDATION — two traces run the actual contour from
 * crown to hem, meeting at the bottom and leaving the silhouette edged in
 * champagne certainty, and as they meet the seal STAMPS on the garment's true
 * centroid, scaled to its width, with a double-report shockwave; (3) THE
 * RECORD — a checksum row typewrites beneath the seal and resolves. The rite
 * settles to a strong resting presence, then stays alive: the edging
 * breathes, a foil sheen crosses the seal every ~7s, and every ~10s a short
 * re-verify arc runs a stretch of the contour. Specs' scan ANALYZES; this one
 * JUDGES — same shape-awareness, different ceremony.
 *
 * Shape awareness comes from `../lib/silhouette2d` (the shared canvas-2D
 * sampler — NEVER `@/shared/webgl/particleShapes` or three.js in any form,
 * per the chunk-hygiene rule in docs/animation-guidelines.md "Passport
 * section effects": that import would drag `vendor-three` into this lazy
 * chunk). The product <img> is a SIBLING subtree, so geometry maps through
 * the displayed `object-contain` rect (`useContainedMediaRect`, falling back
 * to contain math from the sampled aspect, then the classic stage inset).
 *
 * The markup is authored AT REST (outline edged, seal landed, checksum
 * resolved, ceremony at rest alpha; every transient actor hidden): reduced
 * motion — and the pre-sample pending beat — render it untouched with zero
 * GSAP, and the animated path only converges back to the authored state.
 * Sample null (no image, opaque photo, failed decode) → the previous
 * stage-centered rite as the designed fallback: fixed seal position, blind
 * beam, no contour. Champagne is the proof color — never green. Over the
 * 300-line soft limit deliberately: layout solver, choreography and the
 * authored-at-rest markup are one seam (EffectSpecs' dispensation).
 */

/* 4:5 stage space — both host tiers render a 4:5 box, so units are square. */
const [VIEW_W, VIEW_H] = [400, 500]

/* Theme tokens at runtime; literal fallbacks are the oath-dark values so
   jsdom (no stylesheet) and a var-less host still draw on-brand. */
const CHAMPAGNE = 'var(--color-highlight-bright, #e08a4a)'
const BONE = 'var(--color-heading, #E7E4DF)'
const MUTED = 'var(--color-text-muted, #bab8b3)'
const LINE = 'var(--color-line, rgba(231, 228, 223, 0.14))'

/* Choreography clock (seconds). One place, per the house standard. */
const READ_AT = 0
const READ_S = 1.4
const VALIDATE_AT = 1.4
const TRACE_S = 1.0
const SEAL_AT = 2.35 // the stamp lands AS the two traces meet at the hem
const SEAL_STAMP_S = 0.5
const SEAL_INNER_LAG = 0.1 // inner ring lands a breath late — a press, not a flash
const SEAL_IMPACT_LAG = 0.12 // shockwave fires as the stamp LANDS, not as it falls
const SHOCKWAVE_S = 0.75
const SHOCKWAVE_ECHO_LAG = 0.14 // primary + fainter echo — a double report reads as authority
const RECORD_AT = 2.6
const GLYPH_FLICKER_S = 0.4
const GLYPH_STAGGER = 0.045
const SETTLE_AT = 3.4
const SETTLE_S = 0.7
const REST_ALPHA = 0.6 // sealed: a strong fixture, never furniture
const BREATH_HALF_S = 3.1 // idle edging breath (half period)
const BREATH_LOW = 0.78
const SHEEN_EVERY_S = 7
const SHEEN_TRAVEL_S = 1.7
const REVERIFY_EVERY_S = 10
const REVERIFY_RUN_S = 1.3 // one re-verify arc's run along the contour
const REVERIFY_TRAVEL = 0.42 // dashoffset distance — a stretch, not a lap
const REVERIFY_ARC_LEN = 0.09 // the lit arc's length, in pathLength=1 terms
const REVERIFY_FIRST_DELAY_S = 3

/* Seal sizing: ~34% of the silhouette's widest row (the brief's register). */
const SEAL_WIDTH_FRACTION = 0.34
const SHOCKWAVES = [
  { strokeWidth: 1.5, peakAlpha: 0.85, scale: 2.3 },
  { strokeWidth: 1, peakAlpha: 0.4, scale: 1.75 },
] as const

/**
 * The resolved "checksum" is decorative fiction — a fixed hex-feel string,
 * NEVER derived from real data (unit serials are internal-only and must never
 * surface to customers). Two champagne characters sit inside a muted row.
 */
const CHECKSUM_RESOLVED = 'A7F4C209E1'
const CHAMPAGNE_GLYPH_INDICES = new Set([2, 7])
const FLICKER_CHARSET = 'ABCDEF0123456789'
const CHECKSUM_STYLE: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  letterSpacing: '0.18em',
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const px = (v: number) => v.toFixed(1)

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

/** What the layout solver reads from the shared silhouette sample. */
interface AuthGeom {
  outline: SilhouettePoint[]
  rows: ReadonlyArray<SilhouetteRow | null>
  rowCount: number
  top: number // first/last opaque row centers, fraction of image height
  bottom: number
  centroid: SilhouettePoint
  widest: number // widest row's span, fraction of image width — sizes the seal
  aspect: number
}

function toGeom(s: SilhouetteSample2D): AuthGeom {
  let first = -1
  let last = -1
  let widest = 0
  for (let y = 0; y < s.rows.length; y += 1) {
    const row = s.rows[y]
    if (!row) continue
    if (first < 0) first = y
    last = y
    widest = Math.max(widest, row.right - row.left)
  }
  const h = s.maskHeight
  return {
    outline: s.outline,
    rows: s.rows,
    rowCount: h,
    top: (Math.max(first, 0) + 0.5) / h,
    bottom: (Math.max(last, 0) + 0.5) / h,
    centroid: s.centroid,
    widest,
    aspect: s.aspect,
  }
}

/** Normalized outline points → an SVG path in region coordinates. */
function pathOf(pts: SilhouettePoint[], R: Region, close: boolean): string {
  let d = ''
  for (let i = 0; i < pts.length; i += 1) {
    d += `${i === 0 ? 'M' : 'L'} ${px(R.x + pts[i].x * R.w)} ${px(R.y + pts[i].y * R.h)} `
  }
  return close ? `${d}Z` : d.trimEnd()
}

/** Split the closed loop at its crown and hem: two crown→hem halves, so the
 *  validation traces run both directions from the top and meet at the bottom. */
function poleSplit(outline: SilhouettePoint[]): { a: SilhouettePoint[]; b: SilhouettePoint[] } {
  const n = outline.length
  let top = 0
  let bot = 0
  for (let i = 1; i < n; i += 1) {
    if (outline[i].y < outline[top].y) top = i
    if (outline[i].y > outline[bot].y) bot = i
  }
  if (top === bot) bot = (top + (n >> 1)) % n // degenerate loop — split opposite
  const a: SilhouettePoint[] = []
  // Walk the index ring both ways, inclusive of both poles.
  for (let i = top; ; i = (i + 1) % n) { a.push(outline[i]); if (i === bot) break }
  const b: SilhouettePoint[] = []
  for (let i = top; ; i = (i - 1 + n) % n) { b.push(outline[i]); if (i === bot) break }
  return { a, b }
}

interface AuthLayout {
  beamY0: number
  beamY1: number
  /** Null without geometry: the beam sweeps blind (no intercepts ever). */
  rowAt: ((f: number) => { lx: number; rx: number } | null) | null
  /** Null without geometry: the fallback rite has no contour to validate. */
  paths: { full: string; traceA: string; traceB: string } | null
  seal: { cx: number; cy: number; r: number }
  checksumX: number
  checksumY: number
}

function buildLayout(
  geom: AuthGeom | null,
  rect: ContainedMediaRect | null,
  tier: 'console' | 'sheet',
): AuthLayout {
  if (!geom) {
    /* The designed fallback — the previous stage-centered rite in spirit:
       fixed seal, blind beam, checksum below. Sheet's seal is larger relative
       because its stage is physically smaller. */
    const r = tier === 'console' ? 74 : 82
    const cy = VIEW_H * 0.44
    return {
      beamY0: 24, beamY1: VIEW_H - 24, rowAt: null, paths: null,
      seal: { cx: VIEW_W / 2, cy, r }, checksumX: VIEW_W / 2, checksumY: cy + r + 30,
    }
  }
  const R = regionFromRect(rect) ?? regionFromAspect(geom.aspect) ?? DEFAULT_REGION
  const beamY0 = clamp(R.y + geom.top * R.h - 10, 4, VIEW_H - 44)
  const beamY1 = clamp(R.y + geom.bottom * R.h + 10, beamY0 + 40, VIEW_H - 4)
  const seal = {
    cx: R.x + geom.centroid.x * R.w,
    cy: R.y + geom.centroid.y * R.h,
    r: clamp(geom.widest * R.w * SEAL_WIDTH_FRACTION * 0.5, 26, 96),
  }
  const { a, b } = poleSplit(geom.outline)
  return {
    beamY0,
    beamY1,
    rowAt: (f: number) => {
      const fy = (beamY0 + f * (beamY1 - beamY0) - R.y) / R.h
      const idx = Math.floor(fy * geom.rowCount)
      if (idx < 0 || idx >= geom.rowCount) return null
      const row = geom.rows[idx]
      return row ? { lx: R.x + row.left * R.w, rx: R.x + row.right * R.w } : null
    },
    paths: {
      full: pathOf(geom.outline, R, true),
      traceA: pathOf(a, R, false),
      traceB: pathOf(b, R, false),
    },
    seal,
    checksumX: clamp(seal.cx, 72, VIEW_W - 72),
    checksumY: Math.min(seal.cy + seal.r + 30, VIEW_H - 14),
  }
}

type GeomState = AuthGeom | 'pending' | null

export default function EffectAuthenticity({ imageUrl, tier }: PassportEffectProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const isConsole = tier === 'console'
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  // The product <img> is a SIBLING subtree (the effect layer overlays the
  // stage), so the measured box is the layer's parent — the stage itself.
  const setRoot = useCallback((el: SVGSVGElement | null) => {
    svgRef.current = el
    const stage = el ? (el.closest('[data-pp-effect]')?.parentElement ?? el.parentElement) : null
    stageRef.current = stage as HTMLElement | null
  }, [])
  const mediaRect = useContainedMediaRect(stageRef, 'img')

  const [geom, setGeom] = useState<GeomState>(imageUrl ? 'pending' : null)
  useEffect(() => {
    if (!imageUrl) {
      setGeom(null)
      return
    }
    let cancelled = false
    setGeom('pending')
    // The shared sampler resolves null on ANY failure — the designed fallback.
    void sampleSilhouette2D(imageUrl).then((s) => void (cancelled || setGeom(s ? toGeom(s) : null)))
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  /* Null while the sample is pending — the rite waits for real geometry
     rather than booting twice. The markup renders the fallback layout in the
     meantime (authored at rest, so a pending beat just shows the still). */
  const layout = useMemo(
    () => (geom === 'pending' ? null : buildLayout(geom, mediaRect, tier)),
    [geom, mediaRect, tier],
  )
  const shown = useMemo(() => layout ?? buildLayout(null, mediaRect, tier), [layout, mediaRect, tier])
  /* Sheet = lighter, per the tier contract: shorter checksum, one shockwave. */
  const checksum = CHECKSUM_RESOLVED.slice(0, isConsole ? 10 : 8)
  const waves = isConsole ? SHOCKWAVES : SHOCKWAVES.slice(0, 1)

  useGSAP(
    () => {
      const svg = svgRef.current
      /* Reduced motion (and pending) ⇒ the authored still: outline edged,
         seal at centroid (or center), checksum resolved, rest alpha. */
      if (!svg || reducedMotion || !layout) return
      const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)
      const all = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel))
      const ceremony = one<SVGGElement>('[data-auth="ceremony"]')
      const beam = one<SVGGElement>('[data-auth="beam"]')
      const live = one<SVGGElement>('[data-auth="beam-live"]')
      const seg = one<SVGLineElement>('[data-auth="beam-seg"]')
      const glintL = one<SVGCircleElement>('[data-auth="glint-l"]')
      const glintR = one<SVGCircleElement>('[data-auth="glint-r"]')
      const outer = one<SVGCircleElement>('[data-auth="seal-outer"]')
      const inner = one<SVGCircleElement>('[data-auth="seal-inner"]')
      const sheen = one<SVGRectElement>('[data-auth="sheen"]')
      const edging = one<SVGGElement>('[data-auth="edging"]')
      const pulse = one<SVGPathElement>('[data-auth="pulse"]')
      const traces = all<SVGPathElement>('[data-auth="trace"]')
      const waveEls = all<SVGCircleElement>('[data-auth="shockwave"]')
      const glyphs = all<SVGTSpanElement>('[data-auth="glyph"]')
      if (!ceremony || !beam || !live || !seg || !glintL || !glintR || !outer || !inner || !sheen)
        return

      const settled = glyphs.map((g) => g.textContent ?? '')
      const sweep = { f: 0 }
      /* Per-frame beam registration: position the beam, then let it READ the
         silhouette — the bright segment + glints snap to this row's real
         intercepts. Direct attribute writes (no React, no layout reads). */
      const place = () => {
        const y = layout.beamY0 + sweep.f * (layout.beamY1 - layout.beamY0)
        beam.setAttribute('transform', `translate(0 ${y.toFixed(2)})`)
        const row = layout.rowAt ? layout.rowAt(sweep.f) : null
        live.setAttribute('opacity', row ? '1' : '0')
        if (!row) return
        seg.setAttribute('x1', px(row.lx))
        seg.setAttribute('x2', px(row.rx))
        glintL.setAttribute('cx', px(row.lx))
        glintR.setAttribute('cx', px(row.rx))
      }

      const tl = gsap.timeline()
      tl.set(ceremony, { opacity: 1 }, 0) // the rite runs at full presence

      // 1 — THE READ. The instrument reading the object, visibly.
      tl.fromTo(beam, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out' }, READ_AT)
      tl.fromTo(sweep, { f: 0 }, { f: 1, duration: READ_S, ease: 'power2.inOut', onUpdate: place }, READ_AT)
      tl.to(beam, { opacity: 0, duration: 0.25, ease: 'power1.out' }, READ_AT + READ_S - 0.1)

      // 2 — THE VALIDATION. Both traces run crown→hem, meet at the bottom and
      // leave the silhouette edged; the seal stamps as they meet.
      traces.forEach((trace) => {
        tl.fromTo(trace, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: TRACE_S, ease: 'power1.inOut' }, VALIDATE_AT)
      })
      const stamp = { transformOrigin: '50% 50%' }
      tl.fromTo(outer, { scale: 1.22, opacity: 0, ...stamp }, { scale: 1, opacity: 1, duration: SEAL_STAMP_S, ease: 'power4.out' }, SEAL_AT)
      tl.fromTo(inner, { scale: 1.32, opacity: 0, ...stamp }, { scale: 1, opacity: 0.7, duration: SEAL_STAMP_S, ease: 'power4.out' }, SEAL_AT + SEAL_INNER_LAG)
      waveEls.forEach((wave, i) => {
        const spec = SHOCKWAVES[i]
        if (!spec) return
        tl.fromTo(wave, { scale: 1, opacity: spec.peakAlpha, ...stamp }, { scale: spec.scale, opacity: 0, duration: SHOCKWAVE_S, ease: 'power2.out' }, SEAL_AT + SEAL_IMPACT_LAG + i * SHOCKWAVE_ECHO_LAG)
      })

      // 3 — THE RECORD. Each glyph flickers through the charset, then locks
      // its authored character — the readout resolving left to right.
      glyphs.forEach((glyph, i) => {
        const finalChar = settled[i] ?? ''
        const flicker = () => {
          glyph.textContent = FLICKER_CHARSET.charAt(Math.floor(Math.random() * FLICKER_CHARSET.length))
        }
        tl.fromTo(
          glyph,
          { opacity: 0 },
          { opacity: 1, duration: GLYPH_FLICKER_S, ease: 'none', onUpdate: flicker, onComplete: () => void (glyph.textContent = finalChar) },
          RECORD_AT + i * GLYPH_STAGGER,
        )
      })
      tl.to(ceremony, { opacity: REST_ALPHA, duration: SETTLE_S, ease: 'power2.inOut' }, SETTLE_AT)

      // 4 — LIVING IDLE. The proof is alive, not a stamp on a document.
      const idleAt = SETTLE_AT + SETTLE_S
      if (edging) tl.to(edging, { opacity: BREATH_LOW, duration: BREATH_HALF_S, ease: 'sine.inOut', yoyo: true, repeat: -1 }, idleAt)
      tl.set(sheen, { opacity: 1 }, idleAt)
      tl.fromTo(sheen, { x: -layout.seal.r * 2.4 }, { x: layout.seal.r * 2.4, duration: SHEEN_TRAVEL_S, ease: 'power2.inOut', repeat: -1, repeatDelay: SHEEN_EVERY_S - SHEEN_TRAVEL_S }, idleAt)
      if (pulse) {
        const loop = gsap.timeline({ repeat: -1 })
        loop.fromTo(pulse, { strokeDashoffset: REVERIFY_TRAVEL }, { strokeDashoffset: 0, duration: REVERIFY_RUN_S, ease: 'power2.inOut', immediateRender: false }, 0)
        loop.fromTo(pulse, { opacity: 0 }, { opacity: 0.9, duration: 0.3, ease: 'power1.out', immediateRender: false }, 0)
        loop.to(pulse, { opacity: 0, duration: 0.4, ease: 'power1.in' }, REVERIFY_RUN_S - 0.4)
        loop.to({}, { duration: 0.001 }, REVERIFY_EVERY_S - 0.001) // hold the cadence
        tl.add(loop, idleAt + REVERIFY_FIRST_DELAY_S)
      }

      /* GSAP's revert restores styles it tweened but not textContent — put
         the settled checksum back if torn down mid-flicker. */
      return () => {
        glyphs.forEach((g, i) => void (g.textContent = settled[i] ?? ''))
      }
    },
    /* revertOnUpdate: a reduced-motion flip (or a late layout) mid-flight
       must restore the authored rest state before the next pass renders. */
    { scope: svgRef, dependencies: [reducedMotion, layout], revertOnUpdate: true },
  )

  return (
    <svg
      ref={setRoot}
      data-passport-effect="authenticity"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      /* Both hosts pin the stage to 4:5, so `none` keeps units square while
         guaranteeing the geometry spans the box exactly. */
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full overflow-visible"
    >
      <defs>
        <clipPath id={`auth-seal-${uid}`}>
          <circle cx={px(shown.seal.cx)} cy={px(shown.seal.cy)} r={px(shown.seal.r * 0.94)} />
        </clipPath>
        <linearGradient id={`auth-foil-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.35" stopColor={CHAMPAGNE} stopOpacity="0" />
          <stop offset="0.5" stopColor={CHAMPAGNE} stopOpacity="0.8" />
          <stop offset="0.65" stopColor={CHAMPAGNE} stopOpacity="0" />
        </linearGradient>
      </defs>

      <g data-auth="ceremony" opacity={REST_ALPHA}>
        {/* THE READ — transient by nature, authored hidden. `beam-live` is the
            shape-aware part: per-frame code raises it only while the beam is
            over a real silhouette row (never, on the blind fallback sweep). */}
        <g data-auth="beam" opacity={0} transform={`translate(0 ${shown.beamY0.toFixed(2)})`}>
          <line x1={8} y1={0} x2={VIEW_W - 8} y2={0} stroke={BONE} strokeOpacity={0.15} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <g data-auth="beam-live" opacity={0}>
            <line data-auth="beam-seg" x1={120} y1={0} x2={280} y2={0} stroke={CHAMPAGNE} strokeOpacity={0.95} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
            <circle data-auth="glint-l" cx={120} cy={0} r={2.6} fill={CHAMPAGNE} />
            <circle data-auth="glint-r" cx={280} cy={0} r={2.6} fill={CHAMPAGNE} />
          </g>
        </g>

        {/* THE VALIDATION — the contour edging, authored complete at rest.
            The hairline underlay is the die's edge; the two traces ARE the
            champagne certainty once drawn. */}
        {shown.paths ? (
          <g data-auth="edging">
            <path d={shown.paths.full} fill="none" stroke={LINE} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <path data-auth="trace" d={shown.paths.traceA} pathLength={1} fill="none" stroke={CHAMPAGNE} strokeOpacity={0.85} strokeWidth={1.1} strokeDasharray={1} strokeDashoffset={0} vectorEffect="non-scaling-stroke" />
            <path data-auth="trace" d={shown.paths.traceB} pathLength={1} fill="none" stroke={CHAMPAGNE} strokeOpacity={0.85} strokeWidth={1.1} strokeDasharray={1} strokeDashoffset={0} vectorEffect="non-scaling-stroke" />
          </g>
        ) : null}
        {/* The idle re-verify arc — a short lit stretch that runs the contour. */}
        {shown.paths ? (
          <path data-auth="pulse" d={shown.paths.full} pathLength={1} fill="none" stroke={CHAMPAGNE} strokeWidth={1.6} strokeDasharray={`${REVERIFY_ARC_LEN} ${1 - REVERIFY_ARC_LEN}`} strokeDashoffset={0} opacity={0} vectorEffect="non-scaling-stroke" />
        ) : null}

        {/* THE SEAL — stamped on the garment's real centroid, scaled to its
            silhouette width. Shockwaves scale past the rings (overflow ok). */}
        <g data-auth="seal">
          {waves.map((wave, i) => (
            <circle key={i} data-auth="shockwave" cx={px(shown.seal.cx)} cy={px(shown.seal.cy)} r={px(shown.seal.r)} fill="none" stroke={CHAMPAGNE} strokeWidth={wave.strokeWidth} opacity={0} vectorEffect="non-scaling-stroke" />
          ))}
          <circle cx={px(shown.seal.cx)} cy={px(shown.seal.cy)} r={px(shown.seal.r * 1.05)} fill="none" stroke={LINE} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <circle data-auth="seal-outer" cx={px(shown.seal.cx)} cy={px(shown.seal.cy)} r={px(shown.seal.r)} fill="none" stroke={CHAMPAGNE} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
          <circle data-auth="seal-inner" cx={px(shown.seal.cx)} cy={px(shown.seal.cy)} r={px(shown.seal.r * 0.8)} fill="none" stroke={CHAMPAGNE} strokeWidth={1} strokeDasharray="3 4.5" opacity={0.7} vectorEffect="non-scaling-stroke" />
          {/* Foil sheen, clipped to the seal disc so it reads as foil ON the mark. */}
          <g clipPath={`url(#auth-seal-${uid})`}>
            <g transform={`rotate(24 ${px(shown.seal.cx)} ${px(shown.seal.cy)})`}>
              <rect data-auth="sheen" x={px(shown.seal.cx - shown.seal.r * 0.55)} y={px(shown.seal.cy - shown.seal.r * 1.3)} width={px(shown.seal.r * 1.1)} height={px(shown.seal.r * 2.6)} fill={`url(#auth-foil-${uid})`} opacity={0} />
            </g>
          </g>
        </g>

        {/* THE RECORD — beneath the seal; decorative fiction, never a serial. */}
        <text data-auth="checksum" x={px(shown.checksumX)} y={px(shown.checksumY)} textAnchor="middle" fontSize={isConsole ? 13 : 11} style={CHECKSUM_STYLE}>
          {checksum.split('').map((ch, i) => (
            <tspan key={i} data-auth="glyph" fill={CHAMPAGNE_GLYPH_INDICES.has(i) ? CHAMPAGNE : MUTED}>
              {ch}
            </tspan>
          ))}
        </text>
      </g>
    </svg>
  )
}
