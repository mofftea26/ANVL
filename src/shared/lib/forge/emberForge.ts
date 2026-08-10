import { mix } from '@/shared/lib/color'
import { readThemeCssColor } from '@/shared/lib/themeColor'

/**
 * The shared ember-forge engine — framework-agnostic maths (no React, no DOM
 * mounting) behind every canvas-2D ember swarm in the app: the shared
 * `<Modal>`'s materialization and every sonner toast's arrival. Both were
 * independently-written near-duplicates of this exact algorithm; this module
 * is the single source of truth so they can never drift apart again (the
 * `Modal.tsx` `FORGE_MS = 1000` vs. `ModalForgeEffect.tsx` `DURATION_MS = 950`
 * split was exactly that kind of drift).
 *
 * Deliberately canvas-2D, not three.js: this module lives in the shared UI
 * chunk that both the admin and the storefront load, and a few hundred arcs
 * for under a second is far below canvas-2D's budget — no `vendor-three` in
 * the shared path. See `src/shared/components/ui/ForgeEmberCanvas.tsx` for
 * the React shell that owns the canvas element, DPR scaling, and the rAF
 * loop built on top of these functions, and `./forgeSurface.ts` for how big
 * and how sharp that canvas needs to be.
 *
 * The deep motion maths below (dissolve curve, per-seed stagger, flicker,
 * hot-core pass, launch spread/radius jitter) is one shared *shape* — every
 * surface draws through the same `drawForgeFrame`/`buildEmbers` — but the
 * exact numbers feeding it are a {@link ForgeMotionTuning} preset, not a
 * single hardcoded set. `ModalForgeEffect` and `ToastForgeEffect` were
 * independently tuned (dissolve start, stagger rate, alpha weights, hot-core
 * radius fraction, and landing jitter all differ slightly between them) and
 * both presets preserve those numbers exactly — see `MODAL_FORGE_TUNING` /
 * `TOAST_FORGE_TUNING` below. Only the truly-identical formulas (flicker,
 * hot-core threshold/alpha factor, dissolve end, spread range) are shared
 * without a knob.
 *
 * HOW IT DRAWS, AND WHY (measured on a GPU-accelerated canvas, 520 embers at
 * the `t = 0.9` peak where every ember also burns a hot core — 1040 fills):
 *
 *  - **Still `arc` + `fill`, deliberately not pre-rendered sprites.** Blitting
 *    a pre-rendered ember (`drawImage` from a canvas OR an `ImageBitmap`, either
 *    scaled or at an exact per-tier device size) measured **2.3–2.5× slower**
 *    than filling the path: 0.71–0.78 ms/frame against 0.61 ms. At these radii
 *    (1.6–4.3 CSS px) a circle is a trivial analytic AA fill, while every
 *    `drawImage` pays source/sampler setup. Cost here is per-draw-call, not
 *    fill rate — it scales linearly with ember count and is flat against DPR.
 *  - **`fillStyle` is written only when the colour actually changes.** That was
 *    the one real win: a CSS-colour-string write per ember cost 0.14 ms/frame
 *    (0.61 → 0.47). {@link buildEmbers} therefore emits the swarm **grouped by
 *    ramp tier**, so a frame writes `fillStyle` three times instead of 520.
 *    Unsorted input still draws correctly, just with more writes.
 *  - **The hot-core pass is deferred** to one batch at the end of the frame
 *    (one more `fillStyle` write, not one per ember). Safe because the swarm
 *    composites with `lighter` — saturating addition is order-independent.
 *  - **No `Math.sin` per ember**: the per-ember flicker phase is baked into
 *    `flickerSin`/`flickerCos` at build time and folded in with the
 *    angle-addition identity, which is exactly equal to the original.
 *  - `globalAlpha` is still written per ember. Removing those writes entirely
 *    (an unreachable upper bound for any alpha-quantisation scheme) saved
 *    0.04 ms/frame — 0.26% of a 16.7 ms frame — which does not justify banding
 *    a 520-ember cross-fade into alpha tiers.
 */

export interface ForgeRect {
  left: number
  top: number
  width: number
  height: number
}

export interface ForgeRamp {
  cold: string
  ember: string
  hot: string
}

export interface Ember {
  /** Current absolute launch point — recomputed by {@link projectEmber}. */
  fx: number
  fy: number
  /** Current absolute landing point — recomputed by {@link projectEmber}. */
  tx: number
  ty: number
  /** Stable for the ember's whole life: progress stagger + flicker phase. */
  seed: number
  /** Stable base radius. */
  r: number
  /** Stable resolved fill color (one of the ramp's three tiers). */
  color: string
  /** True when this ember walks the rect's perimeter rather than dusting its face. */
  edge: boolean
  /** Perimeter fraction (edge embers only) — the input to {@link walkRectPerimeter}. */
  d01: number
  /** Face fractions (non-edge embers only), relative to the rect. */
  fx01: number
  fy01: number
  /** Scattered launch angle + reach factor, relative to the origin/rect. */
  ang: number
  spreadFactor: number
  /** Small fixed per-ember landing jitter (px), stable for its whole life. */
  jitterX: number
  jitterY: number
  /**
   * `sin`/`cos` of this ember's flicker phase (`seed * tuning.flickerSeedScale`),
   * baked in at build time so {@link drawForgeFrame} needs no `Math.sin` per
   * ember — see the angle-addition note there. Derived from the tuning
   * `buildEmbers` was given, so draw with the same preset you built with (every
   * caller does; both presets share `flickerSeedScale` anyway).
   */
  flickerSin: number
  flickerCos: number
}

/** Smooth Hermite interpolation between `a` and `b`, clamped to [0, 1]. */
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** One exported duration constant — kills the 950ms/1000ms `Modal`/`ModalForgeEffect` drift. */
export const FORGE_DURATION_MS = 950

/**
 * The launch ring is an ellipse: `projectEmber` squashes its y by this.
 * Exported for `forgeSurface.ts`, which has to reproduce the ring's extent.
 */
export const FORGE_LAUNCH_Y_SQUASH = 0.8
/**
 * An unlanded ember is drawn this much larger, tapering to `1×` as it lands.
 * Exported for the same reason — it sets how far outside its own point an ember
 * paints, so the surface's padding is derived from it rather than guessed.
 */
export const FORGE_EMBER_GROWTH = 0.8

/**
 * Every number that made `ModalForgeEffect` and `ToastForgeEffect`'s output
 * subtly different before this refactor. Two presets below carry each
 * surface's own original values so unifying the *code* never means
 * unifying the *numbers* — with `tuning` unset, `buildEmbers`/`drawForgeFrame`
 * default to {@link MODAL_FORGE_TUNING}.
 */
export interface ForgeMotionTuning {
  /** `smoothstep(dissolveStart, dissolveEnd, t)` — the swarm's fade-out window. */
  dissolveStart: number
  dissolveEnd: number
  /** Per-seed progress: `p = smoothstep(0, 1, t * staggerRate - seed * staggerOffset)`. */
  staggerRate: number
  staggerOffset: number
  /** `alpha = (alphaBase + alphaWeight * p) * (1 - dissolve) * flicker`. */
  alphaBase: number
  alphaWeight: number
  /** `flicker = flickerBase + flickerAmplitude * sin(now * flickerTimeScale + seed * flickerSeedScale)`. */
  flickerBase: number
  flickerAmplitude: number
  flickerTimeScale: number
  flickerSeedScale: number
  /** Hot-core pass fires once `p` exceeds this, drawn at `r * hotCoreRadiusFraction`, `alpha * hotCoreAlphaFactor`. */
  hotCoreThreshold: number
  hotCoreRadiusFraction: number
  hotCoreAlphaFactor: number
  /** Launch spread distance factor: `reach * (spreadBase + Math.random() * spreadRange)`. */
  spreadBase: number
  spreadRange: number
  /** Base radius: `radiusBase + Math.random() * radiusRange`. */
  radiusBase: number
  radiusRange: number
  /** Final landing-point jitter magnitude in px (`0` disables it entirely). */
  landingJitterPx: number
}

/** `ModalForgeEffect`'s original numbers, verbatim. */
export const MODAL_FORGE_TUNING: ForgeMotionTuning = {
  dissolveStart: 0.62,
  dissolveEnd: 0.98,
  staggerRate: 1.55,
  staggerOffset: 0.45,
  alphaBase: 0.25,
  alphaWeight: 0.75,
  flickerBase: 0.7,
  flickerAmplitude: 0.3,
  flickerTimeScale: 0.02,
  flickerSeedScale: 40,
  hotCoreThreshold: 0.85,
  hotCoreRadiusFraction: 0.45,
  hotCoreAlphaFactor: 0.9,
  spreadBase: 0.55,
  spreadRange: 0.7,
  radiusBase: 0.8,
  radiusRange: 1.6,
  landingJitterPx: 1,
}

/** `ToastForgeEffect`'s original numbers, verbatim. */
export const TOAST_FORGE_TUNING: ForgeMotionTuning = {
  dissolveStart: 0.58,
  dissolveEnd: 0.98,
  staggerRate: 1.6,
  staggerOffset: 0.42,
  alphaBase: 0.28,
  alphaWeight: 0.72,
  flickerBase: 0.7,
  flickerAmplitude: 0.3,
  flickerTimeScale: 0.02,
  flickerSeedScale: 40,
  hotCoreThreshold: 0.85,
  hotCoreRadiusFraction: 0.42,
  hotCoreAlphaFactor: 0.9,
  spreadBase: 0.5,
  spreadRange: 0.7,
  radiusBase: 0.7,
  radiusRange: 1.4,
  landingJitterPx: 0,
}

/**
 * Even-paced walk of a rect's perimeter. `index / count` is the fraction of
 * the way around; fractional indices (e.g. `i + Math.random()`) jitter the
 * position along the perimeter without changing which edge it lands on.
 * The single source for what was three near-identical implementations
 * (`ModalForgeEffect.tsx`, `ToastForgeEffect.tsx`, `AltarStrikeEmbers.tsx`).
 */
export function walkRectPerimeter(
  index: number,
  count: number,
  rect: ForgeRect,
): { x: number; y: number } {
  if (count <= 0) return { x: rect.left, y: rect.top }
  const perimeter = 2 * (rect.width + rect.height)
  let d = (index / count) * perimeter
  if (d < rect.width) {
    return { x: rect.left + d, y: rect.top }
  }
  if (d < rect.width + rect.height) {
    return { x: rect.left + rect.width, y: rect.top + (d - rect.width) }
  }
  if (d < rect.width * 2 + rect.height) {
    d -= rect.width + rect.height
    return { x: rect.left + rect.width - d, y: rect.top + rect.height }
  }
  d -= rect.width * 2 + rect.height
  return { x: rect.left, y: rect.top + rect.height - d }
}

/**
 * Resolve the ember colour ramp.
 *
 * Unset — today's exact theme ramp (`readThemeCssColor`), unchanged.
 *
 * Set — rebuilt around the tint: a desaturated-light "cold" stop, the tint
 * itself as the dominant "ember" tier, and a near-white "hot" stop so the
 * hot-core flash (see {@link drawForgeFrame}) still reads as forged metal,
 * not flat neon, even when tinted.
 */
export function resolveForgeRamp(tint?: string): ForgeRamp {
  if (!tint) {
    return {
      cold: readThemeCssColor('--color-heading', '#E7E4DF'),
      ember: readThemeCssColor('--color-highlight', '#c2703d'),
      hot: readThemeCssColor('--color-highlight-bright', '#e08a4a'),
    }
  }
  return {
    cold: mix(tint, '#ffffff', 0.6),
    ember: tint,
    hot: mix(tint, '#ffffff', 0.85),
  }
}

/**
 * Re-resolve an ember's absolute launch/landing points against a rect that
 * may have moved since the last frame (e.g. a toast plate mid-restack).
 * Mutates `ember.fx/fy/tx/ty` in place; every other field is stable for the
 * ember's whole life. `buildEmbers` calls this once per ember to establish
 * its initial position; `ForgeEmberCanvas` calls it again every frame for
 * `getRect`-driven (live) callers.
 */
export function projectEmber(
  ember: Ember,
  rect: ForgeRect,
  origin?: { x: number; y: number },
): void {
  const cx = origin?.x ?? rect.left + rect.width / 2
  const cy = origin?.y ?? rect.top + rect.height / 2
  const reach = Math.max(rect.width, rect.height)
  ember.fx = cx + Math.cos(ember.ang) * reach * ember.spreadFactor
  ember.fy = cy + Math.sin(ember.ang) * reach * ember.spreadFactor * FORGE_LAUNCH_Y_SQUASH

  if (ember.edge) {
    const target = walkRectPerimeter(ember.d01, 1, rect)
    ember.tx = target.x + ember.jitterX
    ember.ty = target.y + ember.jitterY
  } else {
    ember.tx = rect.left + ember.fx01 * rect.width + ember.jitterX
    ember.ty = rect.top + ember.fy01 * rect.height + ember.jitterY
  }
}

/** Share of embers assigned to the ramp's "cold"/"hot" tiers; the rest are "ember". */
const COLD_HEAT_CEILING = 0.22
const HOT_HEAT_FLOOR = 0.82

/**
 * Build a fresh swarm of embers targeting `rect` (perimeter-biased per
 * `edgeShare`), scattered from `origin` (default: rect centre). Positions are
 * resolved immediately via {@link projectEmber}; a live (`getRect`) caller
 * re-resolves them every frame as the rect moves.
 *
 * The returned array is **grouped by ramp tier** (all `cold`, then all `ember`,
 * then all `hot`) so {@link drawForgeFrame} writes `fillStyle` three times per
 * frame instead of once per ember — the single biggest measured saving in the
 * draw loop. Grouping is a pure reordering: every ember keeps the geometry it
 * was born with, the tier distribution is untouched, and the swarm composites
 * additively, so draw order carries no visual meaning.
 */
export function buildEmbers(options: {
  rect: ForgeRect
  origin?: { x: number; y: number }
  ramp: ForgeRamp
  count: number
  edgeShare: number
  /** Extra multiplier on top of the tuning's launch spread. Default 1 (no change). */
  spreadScale?: number
  /** Which surface's numbers to build with. Default {@link MODAL_FORGE_TUNING}. */
  tuning?: ForgeMotionTuning
}): Ember[] {
  const {
    rect,
    origin,
    ramp,
    count,
    edgeShare,
    spreadScale = 1,
    tuning = MODAL_FORGE_TUNING,
  } = options
  const edgeCount = count > 0 ? Math.max(1, Math.floor(count * edgeShare)) : 0

  // One bucket per ramp tier, concatenated at the end — see the grouping note
  // above. Each ember's own fields are identical to the ungrouped build.
  const cold: Ember[] = []
  const mid: Ember[] = []
  const hot: Ember[] = []

  for (let i = 0; i < count; i += 1) {
    const edge = i < edgeCount
    const heat = Math.random()
    const seed = Math.random()
    const phase = seed * tuning.flickerSeedScale
    const ember: Ember = {
      edge,
      d01: edge ? (i + Math.random()) / edgeCount : 0,
      fx01: Math.random(),
      fy01: Math.random(),
      ang: Math.random() * Math.PI * 2,
      spreadFactor: (tuning.spreadBase + Math.random() * tuning.spreadRange) * spreadScale,
      seed,
      r: tuning.radiusBase + Math.random() * tuning.radiusRange,
      color: heat < COLD_HEAT_CEILING ? ramp.cold : heat < HOT_HEAT_FLOOR ? ramp.ember : ramp.hot,
      jitterX: (Math.random() - 0.5) * 2 * tuning.landingJitterPx,
      jitterY: (Math.random() - 0.5) * 2 * tuning.landingJitterPx,
      flickerSin: Math.sin(phase),
      flickerCos: Math.cos(phase),
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
    }
    projectEmber(ember, rect, origin)
    if (heat < COLD_HEAT_CEILING) cold.push(ember)
    else if (heat < HOT_HEAT_FLOOR) mid.push(ember)
    else hot.push(ember)
  }

  return [...cold, ...mid, ...hot]
}

/**
 * Deferred hot-core draws for the frame in flight: `x, y, r, alpha` per entry.
 * Module-level and reused (grown, never shrunk) so a 60fps loop allocates
 * nothing. Safe because `drawForgeFrame` is never re-entrant — `ToastForgeEffect`
 * draws its concurrent passes one after another, never nested.
 */
let hotCoreScratch = new Float64Array(0)
/** Slots each deferred hot core occupies in {@link hotCoreScratch}. */
const HOT_CORE_STRIDE = 4

/**
 * Draw one animation frame. Caller owns the rAF loop, the canvas clear/DPR
 * transform, and the rect (which may move — call {@link projectEmber} again
 * before this when it does). This is the exact motion maths every surface
 * must preserve verbatim: the dissolve curve, the per-seed stagger, the
 * sin-based flicker, the hot-core pass, and additive (`lighter`) blending.
 *
 * See the module header for why this fills paths rather than blitting sprites,
 * and what the colour grouping / deferred hot-core pass are worth.
 */
export function drawForgeFrame(
  ctx: CanvasRenderingContext2D,
  embers: Ember[],
  state: { t: number; now: number; ramp: ForgeRamp; tuning?: ForgeMotionTuning },
): void {
  const { t, now, ramp } = state
  const tuning = state.tuning ?? MODAL_FORGE_TUNING
  ctx.globalCompositeOperation = 'lighter'
  const dissolve = smoothstep(tuning.dissolveStart, tuning.dissolveEnd, t)

  // The flicker is `sin(now * timeScale + seed * seedScale)`. Split by the
  // angle-addition identity — `sin(a + b) = sin a · cos b + cos a · sin b` —
  // the whole frame needs one `sin`/`cos` pair, and each ember's `b` half is
  // already baked into `flickerSin`/`flickerCos`. Same value, 520 fewer
  // transcendental calls per frame.
  const wave = now * tuning.flickerTimeScale
  const waveSin = Math.sin(wave)
  const waveCos = Math.cos(wave)

  if (hotCoreScratch.length < embers.length * HOT_CORE_STRIDE) {
    hotCoreScratch = new Float64Array(embers.length * HOT_CORE_STRIDE)
  }
  const hotCores = hotCoreScratch
  let hotCount = 0

  // Tracked locally rather than read back off the context: a `fillStyle` write
  // parses a CSS colour string, so it happens only when the tier changes (three
  // times per frame for a `buildEmbers`-grouped swarm).
  let fill = ''

  for (const e of embers) {
    const p = smoothstep(
      0,
      1,
      Math.min(1, Math.max(0, t * tuning.staggerRate - e.seed * tuning.staggerOffset)),
    )
    const flicker =
      tuning.flickerBase +
      tuning.flickerAmplitude * (waveSin * e.flickerCos + waveCos * e.flickerSin)
    const alpha = (tuning.alphaBase + tuning.alphaWeight * p) * (1 - dissolve) * flicker
    if (alpha <= 0.015) continue

    const x = e.fx + (e.tx - e.fx) * p
    const y = e.fy + (e.ty - e.fy) * p
    if (e.color !== fill) {
      fill = e.color
      ctx.fillStyle = fill
    }
    ctx.globalAlpha = Math.min(1, alpha)
    ctx.beginPath()
    ctx.arc(x, y, e.r * (1 + (1 - p) * FORGE_EMBER_GROWTH), 0, Math.PI * 2)
    ctx.fill()

    // Landed embers burn a hot core just before fusing into the target. Queued
    // rather than drawn inline, so all of them share one `fillStyle` write at
    // the end of the frame — additive blending makes the reorder invisible.
    if (p > tuning.hotCoreThreshold) {
      hotCores[hotCount] = x
      hotCores[hotCount + 1] = y
      hotCores[hotCount + 2] = e.r * tuning.hotCoreRadiusFraction
      hotCores[hotCount + 3] = Math.min(1, alpha * tuning.hotCoreAlphaFactor)
      hotCount += HOT_CORE_STRIDE
    }
  }

  if (hotCount > 0) {
    ctx.fillStyle = ramp.hot
    for (let i = 0; i < hotCount; i += HOT_CORE_STRIDE) {
      ctx.globalAlpha = hotCores[i + 3]
      ctx.beginPath()
      ctx.arc(hotCores[i], hotCores[i + 1], hotCores[i + 2], 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
