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
 * loop built on top of these functions.
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
}

/** Smooth Hermite interpolation between `a` and `b`, clamped to [0, 1]. */
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** One exported duration constant — kills the 950ms/1000ms `Modal`/`ModalForgeEffect` drift. */
export const FORGE_DURATION_MS = 950

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
 * (`ModalForgeEffect.tsx`, `ToastForgeEffect.tsx`, `AltarModalForge.tsx`).
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
  ember.fy = cy + Math.sin(ember.ang) * reach * ember.spreadFactor * 0.8

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

  const embers: Ember[] = Array.from({ length: count }, (_, i) => {
    const edge = i < edgeCount
    const heat = Math.random()
    const ember: Ember = {
      edge,
      d01: edge ? (i + Math.random()) / edgeCount : 0,
      fx01: Math.random(),
      fy01: Math.random(),
      ang: Math.random() * Math.PI * 2,
      spreadFactor: (tuning.spreadBase + Math.random() * tuning.spreadRange) * spreadScale,
      seed: Math.random(),
      r: tuning.radiusBase + Math.random() * tuning.radiusRange,
      color: heat < COLD_HEAT_CEILING ? ramp.cold : heat < HOT_HEAT_FLOOR ? ramp.ember : ramp.hot,
      jitterX: (Math.random() - 0.5) * 2 * tuning.landingJitterPx,
      jitterY: (Math.random() - 0.5) * 2 * tuning.landingJitterPx,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
    }
    projectEmber(ember, rect, origin)
    return ember
  })

  return embers
}

/**
 * Draw one animation frame. Caller owns the rAF loop, the canvas clear/DPR
 * transform, and the rect (which may move — call {@link projectEmber} again
 * before this when it does). This is the exact motion maths every surface
 * must preserve verbatim: the dissolve curve, the per-seed stagger, the
 * sin-based flicker, the hot-core pass, and additive (`lighter`) blending.
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

  for (const e of embers) {
    const p = smoothstep(
      0,
      1,
      Math.min(1, Math.max(0, t * tuning.staggerRate - e.seed * tuning.staggerOffset)),
    )
    const flicker =
      tuning.flickerBase +
      tuning.flickerAmplitude * Math.sin(now * tuning.flickerTimeScale + e.seed * tuning.flickerSeedScale)
    const alpha = (tuning.alphaBase + tuning.alphaWeight * p) * (1 - dissolve) * flicker
    if (alpha <= 0.015) continue

    const x = e.fx + (e.tx - e.fx) * p
    const y = e.fy + (e.ty - e.fy) * p
    ctx.globalAlpha = Math.min(1, alpha)
    ctx.fillStyle = e.color
    ctx.beginPath()
    ctx.arc(x, y, e.r * (1 + (1 - p) * 0.8), 0, Math.PI * 2)
    ctx.fill()

    // Landed embers burn a hot core just before fusing into the target.
    if (p > tuning.hotCoreThreshold) {
      ctx.globalAlpha = Math.min(1, alpha * tuning.hotCoreAlphaFactor)
      ctx.fillStyle = ramp.hot
      ctx.beginPath()
      ctx.arc(x, y, e.r * tuning.hotCoreRadiusFraction, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
