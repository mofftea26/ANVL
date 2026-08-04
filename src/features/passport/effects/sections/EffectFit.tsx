import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/shared/lib/gsap'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { useContainedMediaRect } from '@/shared/hooks/useContainedMediaRect'
import type { PassportEffectMarker } from '../effectFacts'
import type { PassportEffectProps } from '../effectTypes'
import { sampleSilhouette2D } from '../lib/silhouette2d'
import {
  buildFitLayout,
  FIT_TYPE,
  FIT_VIEW_H,
  FIT_VIEW_W,
  tapePoint,
  toFitProfile,
  type FitProfile,
} from '../lib/fitLayout'

/**
 * Fit & sizing — "Tailored to the Body". A tailor measures THIS piece.
 *
 * Three tapes wrap the REAL garment at chest / waist / hem — rows of the
 * sampled silhouette that actually hold cloth — each spanning exactly the
 * garment's width at its row with a slight downward bow: a tape resting
 * against a body, not a ruler. End caps sit ON the silhouette edges.
 *
 * The READING on a tape is the passport's own authored measurement
 * (`facts.fit`, the very lines the Fit card renders), counting up as its tape
 * settles when it parses as one number plus a unit and simply revealed when it
 * does not — an authored "48–50 cm" is shown, never mangled into something
 * countable. Nothing is derived from pixels, so with no authored facts the
 * tapes carry NO text at all: shape is measured, numbers are authored, and the
 * two never trade places. It is the largest type on the stage because it is
 * the one thing here a customer may act on. The solver that places and sizes
 * all of that is `../lib/fitLayout` (pure; split out for the 500-line limit).
 *
 * The tapes wrap on staggered — the tailor's three quick passes — then a pin
 * runner circulates the outline forever, pausing at each band-edge crossing to
 * press a pin: a pop, and a mark that dims until the next lap. A size whisper
 * (S · M · L · XL) breathes one glyph at a time. Deliberately DIFFERENT from
 * EffectSpecs, the closest cousin: Specs is instruments analyzing (scan band,
 * typed chips); this is a tailor fitting.
 *
 * Shape truth: `../lib/silhouette2d` — NEVER `@/shared/webgl/particleShapes`
 * (it imports three.js at module top level and would drag `vendor-three` into
 * this lazy chunk; docs/animation-guidelines.md "Passport section effects").
 * The product <img> is a SIBLING of this layer, so geometry maps through the
 * displayed `object-contain` rect (`useContainedMediaRect`), never the raw
 * 4:5 box. SVG + `non-scaling-stroke` keeps tapes at 1 real pixel; all motion
 * is GSAP on refs, so the shared ticker parks on hidden tabs.
 *
 * Degradation: sample null → straight bands at fixed heights, no runner; no
 * facts → tapes with no reading. Reduced motion → the authored still: tapes
 * drawn, readings final, pins resting, runner hidden, no clock — markup is
 * authored AT REST; the animated path only pulls back via `fromTo`.
 */

/* Theme tokens at runtime; literal fallbacks are the oath-dark values so
   jsdom (no stylesheet) and a var-less host still draw on-brand. */
const BONE = 'var(--color-heading, #E7E4DF)'
const CHAMPAGNE = 'var(--color-highlight-bright, #e08a4a)'
const MUTED = 'var(--color-text-muted, #bab8b3)'
const VOID = 'var(--color-bg, #0B0B0C)' // halo behind readouts, over any photo

/* Choreography clock (seconds). One place, per the house standard. */
const WRAP_AT = 0.35
const WRAP_S = 0.85 // one tape's edge-to-edge wrap
const WRAP_STAGGER_S = 0.5 // the tailor's three quick passes
const COUNT_S = 0.8 // measurement count-up once its tape settles
const RUNNER_AT = 2.6
const LAP_MOVE_S = 11 // full-outline travel time, excluding pin pauses
const PIN_HOLD_S = 0.55 // the pause while the runner presses a pin
const PIN_REST_ALPHA = 0.45 // a placed pin's resting presence
const TICKER_START_S = 2.2
const TICKER_PERIOD_S = 5 // one glyph considers, then stillness
const TICKER_BREATH = 1.22

/* Brand face set like a tailor's chalk board (tabular digits on values).
   Casing is presentation — uppercase applied in CSS, so the DOM keeps the
   author's measurement string exactly as they wrote it. */
const face = (letterSpacing: string, extra?: CSSProperties): CSSProperties => ({
  fontFamily: 'var(--font-sans, sans-serif)',
  letterSpacing,
  textTransform: 'uppercase',
  ...extra,
})
const LABEL_STYLE = face('0.22em')
const VALUE_STYLE = face('0.06em', { fontVariantNumeric: 'tabular-nums' })
const TAG_STYLE = face('0.26em')

/**
 * The size whisper — right-aligned in the lower corner. It is annotation about
 * a reading, exactly like a band's term, so it takes the SAME step of the
 * stage's type scale (`FIT_TYPE.label`). It used to be hand-set at 16, which
 * parked a decorative strip between the two declared tiers — and above the
 * reading itself on any band that had to shrink.
 *
 * The rhythm is spaced in ems of that size, anchored at the strip's right end,
 * so the composition survives the scale moving: the steps below reproduce the
 * shipped 286 / 314 / 342 / 374 exactly at 16 (the last is wider because XL is
 * two glyphs), and the dots stay on the gaps' midpoints. `FLOOR_Y` in the
 * solver keeps the readouts off all of it.
 */
const TICKER_FS = FIT_TYPE.label
const TICKER_RIGHT_X = 374
const TICKER_LABELS = ['S', 'M', 'L', 'XL'] as const
const TICKER_XS = [2, 1.75, 1.75].reduce<number[]>(
  (xs, stepEm) => [xs[0] - stepEm * TICKER_FS, ...xs],
  [TICKER_RIGHT_X],
)
const TICKER_DOT_XS = TICKER_XS.slice(1).map((x, i) => (TICKER_XS[i] + x) / 2)
const TICKER_DOT_R = TICKER_FS * 0.09375
const TICKER_DOT_DY = TICKER_FS * 0.3125
const TICKER_Y = 476

/** Stable empty list so the layout memo does not churn on every render. */
const NO_FACTS: readonly PassportEffectMarker[] = []

type ProfileState = FitProfile | 'pending' | null

export default function EffectFit({ imageUrl, tier, facts }: PassportEffectProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const stageRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const isConsole = tier === 'console'
  const fit = facts?.fit ?? NO_FACTS

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
    if (!imageUrl) return void setProfile(null)
    let cancelled = false
    setProfile('pending')
    // The shared sampler resolves null on any failure — the fallback layout.
    void sampleSilhouette2D(imageUrl).then((s) => void (cancelled || setProfile(s ? toFitProfile(s) : null)))
    return () => void (cancelled = true)
  }, [imageUrl])

  /* Null while the sample is pending — the animation waits for real geometry
     rather than booting twice; the markup shows the fallback still meanwhile. */
  const layout = useMemo(() => (profile === 'pending' ? null : buildFitLayout(profile, mediaRect, tier, fit)), [profile, mediaRect, tier, fit])
  const shown = useMemo(() => layout ?? buildFitLayout(null, mediaRect, tier, fit), [layout, mediaRect, tier, fit])

  useGSAP(
    () => {
      const svg = svgRef.current
      /* Reduced motion (and pending) ⇒ the authored still: tapes drawn,
         readings final, pins resting, runner hidden. Zero GSAP. */
      if (!svg || reducedMotion || !layout) return
      const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)
      const all = <T extends Element>(sel: string) => Array.from(svg.querySelectorAll<T>(sel))
      const bandEls = all<SVGGElement>('[data-fit-band]')
      const valueEls = all<SVGTextElement>('[data-fit-value]')
      const runner = one<SVGGElement>('[data-fit-runner]')
      const ping = one<SVGCircleElement>('[data-fit-ping]')
      const pinEls = all<SVGGElement>('[data-fit-pin]')
      const pinPops = all<SVGGElement>('[data-fit-pin-pop]')
      const settled = valueEls.map((el) => el.textContent ?? '')

      const tl = gsap.timeline()
      if (pinEls.length > 0) tl.set(pinEls, { opacity: 0 }, 0) // pins arrive with the runner

      // The tailor's passes: each tape wraps edge-to-edge behind a champagne
      // head, graduations trailing it, and — only where the passport authored
      // one — its measurement arriving as the tape settles.
      layout.bands.forEach((band, i) => {
        const el = bandEls[i]
        if (!el) return
        const tape = el.querySelector<SVGPathElement>('[data-fit-tape]')
        const head = el.querySelector<SVGCircleElement>('[data-fit-head]')
        const ticks = el.querySelectorAll('[data-fit-tick]')
        const caps = el.querySelectorAll('[data-fit-cap]')
        const label = el.querySelector('[data-fit-label]')
        const value = el.querySelector<SVGTextElement>('[data-fit-value]')
        const at = WRAP_AT + i * WRAP_STAGGER_S
        // pathLength=1 normalizes, so dash values are unit-free here.
        if (tape) tl.fromTo(tape, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: WRAP_S, ease: 'power2.inOut' }, at)
        if (head) {
          // Same duration + ease as the dash draw, so head and drawn front
          // stay registered by construction. The head's transform is raw-attr
          // only — GSAP never manages it, so the two cannot fight.
          const draw = { t: 0 }
          const place = () => {
            const p = tapePoint(band.lx, band.rx, band.y, band.bow, draw.t)
            head.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`)
          }
          tl.fromTo(head, { opacity: 0 }, { opacity: 1, duration: 0.1 }, at)
          tl.fromTo(draw, { t: 0 }, { t: 1, duration: WRAP_S, ease: 'power2.inOut', onUpdate: place }, at)
          tl.to(head, { opacity: 0, duration: 0.3, ease: 'power1.out' }, at + WRAP_S)
        }
        if (ticks.length > 0) tl.fromTo(ticks, { opacity: 0 }, { opacity: 1, duration: 0.14, stagger: (WRAP_S - 0.1) / ticks.length }, at + 0.05)
        if (caps.length > 1) {
          tl.fromTo(caps[0], { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out' }, at)
          tl.fromTo(caps[1], { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'back.out(2.4)' }, at + WRAP_S - 0.05)
        }
        if (label) tl.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' }, at + WRAP_S - 0.2)
        if (value) {
          tl.fromTo(value, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' }, at + WRAP_S - 0.15)
          // A clean number + unit counts up; anything else is only revealed,
          // since tweening it would mean rewriting the author's string.
          const c = band.count
          if (c) {
            const n = { v: 0 }
            const write = () => void (value.textContent = `${c.prefix}${n.v.toFixed(c.decimals)}${c.suffix}`)
            tl.fromTo(n, { v: 0 }, { v: c.target, duration: COUNT_S, ease: 'power2.out', onUpdate: write }, at + WRAP_S - 0.15)
          }
        }
      })

      // The pin runner: a lap of the real outline forever, pausing at each
      // band-edge stop to press a pin — pop, mark left behind, oldest dimming
      // until the next lap re-presses it. Continuous life.
      const { outline, stops } = layout
      if (runner && ping && outline && stops.length > 1) {
        const M = outline.length
        const pos = { f: stops[0].f }
        const placeRunner = () => {
          const ff = (((pos.f % 1) + 1) % 1) * M
          const i = ff | 0
          const j = (i + 1) % M
          const x = outline[i].x + (outline[j].x - outline[i].x) * (ff - i)
          const y = outline[i].y + (outline[j].y - outline[i].y) * (ff - i)
          runner.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
        }
        placeRunner()
        tl.fromTo(runner, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' }, RUNNER_AT)
        const lap = gsap.timeline({ repeat: -1 })
        let t = 0
        for (let k = 1; k <= stops.length; k += 1) {
          const from = stops[k - 1].f
          const to = k < stops.length ? stops[k].f : stops[0].f + 1 // wrap leg
          const move = Math.max(to - from, 0.02) * LAP_MOVE_S
          lap.to(pos, { f: to, duration: move, ease: 'sine.inOut', onUpdate: placeRunner }, t)
          t += move
          const stop = stops[k % stops.length]
          const pin = pinEls[k % stops.length]
          const pop = pinPops[k % stops.length]
          lap.set(ping, { attr: { cx: stop.x, cy: stop.y } }, t)
          lap.fromTo(ping, { attr: { r: 3 }, opacity: 0.75 }, { attr: { r: 14 }, opacity: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, t)
          if (pin) {
            lap.to(pin, { opacity: 0.95, duration: 0.12, ease: 'power1.out' }, t)
            lap.to(pin, { opacity: PIN_REST_ALPHA, duration: 3.4, ease: 'power1.out' }, t + 0.4)
          }
          // The pop scales an inner group; the outer keeps the raw translate.
          if (pop) lap.fromTo(pop, { scale: 1.7, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'back.out(2.4)', immediateRender: false }, t)
          t += PIN_HOLD_S
        }
        tl.add(lap, RUNNER_AT)
      }

      // The size whisper: one glyph at a time, sequential, never a marquee.
      // Scaling the <g> keeps the muted base and its champagne twin
      // registered; the twin's opacity IS the color change (fill never tweens).
      const cells = all<SVGGElement>('[data-fit-size]')
      if (cells.length > 0) {
        const breathe = gsap.timeline({ repeat: -1 })
        cells.forEach((cell, i) => {
          const glow = cell.querySelector('[data-fit-size-glow]')
          const at = i * TICKER_PERIOD_S
          breathe.to(cell, { scale: TICKER_BREATH, transformOrigin: '50% 50%', duration: 0.9, ease: 'sine.inOut' }, at)
          breathe.to(cell, { scale: 1, duration: 1.1, ease: 'sine.inOut' }, at + 0.9)
          if (glow) {
            breathe.to(glow, { opacity: 1, duration: 0.9, ease: 'sine.inOut' }, at)
            breathe.to(glow, { opacity: 0, duration: 1.1, ease: 'sine.inOut' }, at + 0.9)
          }
        })
        // The LAST glyph also rests a full period before the loop returns to
        // S — otherwise XL→S back-to-back reads as a marquee.
        breathe.to({}, { duration: 0.01 }, cells.length * TICKER_PERIOD_S)
        tl.add(breathe, TICKER_START_S)
      }

      /* GSAP's revert restores styles/attrs it tweened but not textContent —
         put the settled measurements back if torn down mid-count. */
      return () => {
        valueEls.forEach((el, i) => void (el.textContent = settled[i] ?? ''))
      }
    },
    { scope: svgRef, dependencies: [reducedMotion, layout] },
  )

  return (
    <svg
      ref={setRoot}
      data-passport-effect="fit"
      data-fit-motion={reducedMotion ? 'still' : 'animated'}
      viewBox={`0 0 ${FIT_VIEW_W} ${FIT_VIEW_H}`}
      /* Both hosts pin the stage to 4:5, so `none` keeps units square while
         guaranteeing the geometry spans the box exactly. */
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
    >
      {/* The fitted tapes — chest / waist / hem, spanning the garment's own
          width at their rows, bowed like a tape against a body. */}
      {shown.bands.map((band, bi) => (
        <g key={bi} data-fit-band>
          <path data-fit-tape d={band.d} pathLength={1} fill="none" stroke={BONE} strokeOpacity={0.55} strokeWidth={1} strokeDasharray={1} strokeDashoffset={0} vectorEffect="non-scaling-stroke" />
          {band.ticks.map((tk, ti) => (
            <line key={ti} data-fit-tick x1={tk.x.toFixed(1)} y1={tk.y.toFixed(1)} x2={tk.x.toFixed(1)} y2={(tk.y - tk.rise).toFixed(1)} stroke={BONE} strokeOpacity={0.7} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {/* End caps ON the silhouette edges — scaled up with the readout. */}
          {[band.lx, band.rx].map((cx, ci) => (
            <line key={ci} data-fit-cap x1={cx.toFixed(1)} y1={(band.y - 7).toFixed(1)} x2={cx.toFixed(1)} y2={(band.y + 7).toFixed(1)} stroke={CHAMPAGNE} strokeOpacity={0.95} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
          ))}
          {/* The wrap head — transient draw artifact, hidden in the still. */}
          <circle data-fit-head transform={`translate(${band.lx.toFixed(1)} ${band.y.toFixed(1)})`} r={4} fill={CHAMPAGNE} opacity={0} />
          {/* Text ONLY where the passport authored a measurement: no fact, no
              claim — the tape still shows the garment's real width. The VOID
              halo carries the big glyphs over whatever the photo is doing. */}
          {band.fact ? (
            <>
              <text data-fit-label x={band.vx.toFixed(1)} y={band.labelY.toFixed(1)} textAnchor={band.anchor} fontSize={band.lfs.toFixed(1)} fill={BONE} fillOpacity={0.72} stroke={VOID} strokeOpacity={0.5} strokeWidth={band.lfs * 0.14} paintOrder="stroke" style={LABEL_STYLE}>{band.fact.label}</text>
              <text data-fit-value x={band.vx.toFixed(1)} y={band.valueY.toFixed(1)} textAnchor={band.anchor} fontSize={band.vfs.toFixed(1)} fill={CHAMPAGNE} fillOpacity={0.96} stroke={VOID} strokeOpacity={0.55} strokeWidth={band.vfs * 0.13} paintOrder="stroke" style={VALUE_STYLE}>{band.fact.value}</text>
            </>
          ) : null}
        </g>
      ))}

      {/* Pin marks at the band-edge stops — pressed lap by lap. */}
      {shown.stops.map((s, i) => (
        <g key={i} data-fit-pin transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`} opacity={PIN_REST_ALPHA}>
          <g data-fit-pin-pop>
            <line x1={1.4} y1={-1.4} x2={5.4} y2={-5.4} stroke={BONE} strokeOpacity={0.9} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <circle r={1.7} fill={CHAMPAGNE} />
          </g>
        </g>
      ))}

      {/* The pin runner + its press ping — outline-bound, animation-only. */}
      {shown.stops.length > 1 ? (
        <>
          <g data-fit-runner opacity={0}>
            <circle r={7} fill={CHAMPAGNE} opacity={0.16} />
            <circle r={2.3} fill={CHAMPAGNE} />
            <line x1={0} y1={-2.3} x2={0} y2={-8.5} stroke={BONE} strokeOpacity={0.8} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
          <circle data-fit-ping cx={0} cy={0} r={3} fill="none" stroke={CHAMPAGNE} strokeWidth={1} opacity={0} vectorEffect="non-scaling-stroke" />
        </>
      ) : null}

      {/* The size whisper — S · M · L · XL, lower-right. */}
      <g fontSize={TICKER_FS}>
        {TICKER_LABELS.map((glyph, gi) => (
          <g key={glyph} data-fit-size>
            <text x={TICKER_XS[gi]} y={TICKER_Y} textAnchor="middle" fill={MUTED} fillOpacity={0.9} style={VALUE_STYLE}>{glyph}</text>
            <text data-fit-size-glow x={TICKER_XS[gi]} y={TICKER_Y} textAnchor="middle" fill={CHAMPAGNE} opacity={0} style={VALUE_STYLE}>{glyph}</text>
          </g>
        ))}
        {TICKER_DOT_XS.map((x) => (
          <circle key={x} cx={x} cy={TICKER_Y - TICKER_DOT_DY} r={TICKER_DOT_R} fill={MUTED} fillOpacity={0.6} />
        ))}
      </g>

      {/* Atelier tag — the theme-legibility anchor (console only). */}
      {isConsole ? (
        <g data-fit-tag>
          <g transform="translate(16 16)">
            <circle r={1.9} fill={CHAMPAGNE} />
            <line x1={1.4} y1={-1.4} x2={4.8} y2={-4.8} stroke={BONE} strokeOpacity={0.6} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
          <text x={26} y={19} fontSize={FIT_TYPE.caption} fill={BONE} fillOpacity={0.75} style={TAG_STYLE}>TAILORED · TO THE BODY</text>
        </g>
      ) : null}
    </svg>
  )
}
