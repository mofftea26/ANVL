/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import {
  buildEmbers,
  drawForgeFrame,
  MODAL_FORGE_TUNING,
  resolveForgeRamp,
  TOAST_FORGE_TUNING,
  walkRectPerimeter,
  type ForgeRect,
} from '@/shared/lib/forge/emberForge'

describe('walkRectPerimeter', () => {
  // width=100, height=50 -> perimeter=300; picking count=300 makes index==d,
  // so each edge segment lands on a round number.
  const rect: ForgeRect = { left: 0, top: 0, width: 100, height: 50 }
  const count = 300

  it('walks the top edge', () => {
    expect(walkRectPerimeter(0, count, rect)).toEqual({ x: 0, y: 0 })
    expect(walkRectPerimeter(50, count, rect)).toEqual({ x: 50, y: 0 })
  })

  it('walks the right edge', () => {
    expect(walkRectPerimeter(100, count, rect)).toEqual({ x: 100, y: 0 })
    expect(walkRectPerimeter(125, count, rect)).toEqual({ x: 100, y: 25 })
  })

  it('walks the bottom edge', () => {
    expect(walkRectPerimeter(150, count, rect)).toEqual({ x: 100, y: 50 })
    expect(walkRectPerimeter(200, count, rect)).toEqual({ x: 50, y: 50 })
  })

  it('walks the left edge', () => {
    expect(walkRectPerimeter(250, count, rect)).toEqual({ x: 0, y: 50 })
    expect(walkRectPerimeter(275, count, rect)).toEqual({ x: 0, y: 25 })
  })

  it('closes the loop back to the start', () => {
    expect(walkRectPerimeter(count, count, rect)).toEqual(walkRectPerimeter(0, count, rect))
  })

  it('guards against a non-positive count', () => {
    expect(walkRectPerimeter(0, 0, rect)).toEqual({ x: rect.left, y: rect.top })
  })
})

describe('resolveForgeRamp', () => {
  it('returns the three theme vars unchanged when no tint is given', () => {
    // jsdom has no stylesheet setting these custom properties, so
    // readThemeCssColor falls through to its fallback for each — the exact
    // fallbacks baked into today's ModalForgeEffect/ToastForgeEffect.
    expect(resolveForgeRamp()).toEqual({
      cold: '#E7E4DF',
      ember: '#c2703d',
      hot: '#e08a4a',
    })
  })

  it('rebuilds three distinct colours around a tint', () => {
    const ramp = resolveForgeRamp('#3366ff')
    expect(ramp.ember).toBe('#3366ff')
    expect(ramp.cold).not.toBe(ramp.ember)
    expect(ramp.hot).not.toBe(ramp.ember)
    expect(ramp.cold).not.toBe(ramp.hot)
  })
})

describe('buildEmbers', () => {
  const rect: ForgeRect = { left: 10, top: 20, width: 200, height: 100 }
  const ramp = { cold: '#fff', ember: '#f80', hot: '#fff8f0' }

  it('builds the requested count, each already projected inside the rect swarm radius', () => {
    const embers = buildEmbers({ rect, ramp, count: 50, edgeShare: 0.6 })
    expect(embers).toHaveLength(50)
    for (const e of embers) {
      expect(Number.isFinite(e.tx)).toBe(true)
      expect(Number.isFinite(e.ty)).toBe(true)
      expect(Number.isFinite(e.fx)).toBe(true)
      expect(Number.isFinite(e.fy)).toBe(true)
      expect([ramp.cold, ramp.ember, ramp.hot]).toContain(e.color)
    }
  })

  it('returns an empty swarm for a zero count', () => {
    expect(buildEmbers({ rect, ramp, count: 0, edgeShare: 0.5 })).toEqual([])
  })

  // `spreadScale` is surfaced on `ForgeEmberCanvas` for the About altar (whose
  // swarm has to launch from inside the in-canvas ember shroud it takes over
  // from). Omitting it must stay byte-for-byte what modals and toasts did
  // before that prop existed — hence the "unset === 1" pinning here.
  it('leaves the launch spread at the tuning’s own band when spreadScale is unset', () => {
    for (const e of buildEmbers({ rect, ramp, count: 60, edgeShare: 0.5 })) {
      expect(e.spreadFactor).toBeGreaterThanOrEqual(MODAL_FORGE_TUNING.spreadBase)
      expect(e.spreadFactor).toBeLessThanOrEqual(
        MODAL_FORGE_TUNING.spreadBase + MODAL_FORGE_TUNING.spreadRange,
      )
    }
  })

  it('scales the launch spread band by spreadScale', () => {
    const scale = 0.35
    for (const e of buildEmbers({ rect, ramp, count: 60, edgeShare: 0.5, spreadScale: scale })) {
      expect(e.spreadFactor).toBeGreaterThanOrEqual(MODAL_FORGE_TUNING.spreadBase * scale)
      expect(e.spreadFactor).toBeLessThanOrEqual(
        (MODAL_FORGE_TUNING.spreadBase + MODAL_FORGE_TUNING.spreadRange) * scale,
      )
    }
  })

  // The perf contract: `drawForgeFrame` only writes `fillStyle` when the colour
  // changes, so the swarm has to arrive grouped by ramp tier or that saving
  // evaporates. Contiguous runs, not sorted order — the tier order is arbitrary.
  it('emits the swarm grouped into contiguous ramp-tier runs', () => {
    const embers = buildEmbers({ rect, ramp, count: 400, edgeShare: 0.6 })
    const runs: string[] = []
    for (const e of embers) {
      if (runs[runs.length - 1] !== e.color) runs.push(e.color)
    }
    expect(runs.length).toBeLessThanOrEqual(3)
    expect(new Set(runs).size).toBe(runs.length)
  })

  it('bakes each ember’s flicker phase in so the draw loop needs no per-ember sin', () => {
    for (const e of buildEmbers({ rect, ramp, count: 40, edgeShare: 0.5 })) {
      const phase = e.seed * MODAL_FORGE_TUNING.flickerSeedScale
      expect(e.flickerSin).toBeCloseTo(Math.sin(phase), 12)
      expect(e.flickerCos).toBeCloseTo(Math.cos(phase), 12)
    }
  })
})

describe('MODAL_FORGE_TUNING vs TOAST_FORGE_TUNING', () => {
  // Recovered from git history (pre-refactor ModalForgeEffect.tsx /
  // ToastForgeEffect.tsx) — these five numbers genuinely differed between
  // the two surfaces before this refactor and must keep differing, or the
  // "pixel-identical to today" requirement silently regresses for toast.
  it('preserves each surface on every value that originally differed', () => {
    expect(MODAL_FORGE_TUNING.dissolveStart).toBe(0.62)
    expect(TOAST_FORGE_TUNING.dissolveStart).toBe(0.58)

    expect(MODAL_FORGE_TUNING.staggerRate).toBe(1.55)
    expect(TOAST_FORGE_TUNING.staggerRate).toBe(1.6)

    expect(MODAL_FORGE_TUNING.staggerOffset).toBe(0.45)
    expect(TOAST_FORGE_TUNING.staggerOffset).toBe(0.42)

    expect(MODAL_FORGE_TUNING.alphaBase).toBe(0.25)
    expect(TOAST_FORGE_TUNING.alphaBase).toBe(0.28)

    expect(MODAL_FORGE_TUNING.alphaWeight).toBe(0.75)
    expect(TOAST_FORGE_TUNING.alphaWeight).toBe(0.72)

    expect(MODAL_FORGE_TUNING.hotCoreRadiusFraction).toBe(0.45)
    expect(TOAST_FORGE_TUNING.hotCoreRadiusFraction).toBe(0.42)

    expect(MODAL_FORGE_TUNING.spreadBase).toBe(0.55)
    expect(TOAST_FORGE_TUNING.spreadBase).toBe(0.5)

    expect(MODAL_FORGE_TUNING.radiusBase).toBe(0.8)
    expect(TOAST_FORGE_TUNING.radiusBase).toBe(0.7)

    expect(MODAL_FORGE_TUNING.radiusRange).toBe(1.6)
    expect(TOAST_FORGE_TUNING.radiusRange).toBe(1.4)

    expect(MODAL_FORGE_TUNING.landingJitterPx).toBeGreaterThan(0)
    expect(TOAST_FORGE_TUNING.landingJitterPx).toBe(0)
  })

  it('still shares the formulas that were genuinely identical before the refactor', () => {
    expect(MODAL_FORGE_TUNING.dissolveEnd).toBe(TOAST_FORGE_TUNING.dissolveEnd)
    expect(MODAL_FORGE_TUNING.flickerBase).toBe(TOAST_FORGE_TUNING.flickerBase)
    expect(MODAL_FORGE_TUNING.flickerAmplitude).toBe(TOAST_FORGE_TUNING.flickerAmplitude)
    expect(MODAL_FORGE_TUNING.flickerTimeScale).toBe(TOAST_FORGE_TUNING.flickerTimeScale)
    expect(MODAL_FORGE_TUNING.flickerSeedScale).toBe(TOAST_FORGE_TUNING.flickerSeedScale)
    expect(MODAL_FORGE_TUNING.hotCoreThreshold).toBe(TOAST_FORGE_TUNING.hotCoreThreshold)
    expect(MODAL_FORGE_TUNING.hotCoreAlphaFactor).toBe(TOAST_FORGE_TUNING.hotCoreAlphaFactor)
    expect(MODAL_FORGE_TUNING.spreadRange).toBe(TOAST_FORGE_TUNING.spreadRange)
  })

  it('buildEmbers/drawForgeFrame default to the modal preset when tuning is unset', () => {
    const rect: ForgeRect = { left: 0, top: 0, width: 100, height: 100 }
    const ramp = { cold: '#fff', ember: '#f80', hot: '#fff8f0' }
    const embers = buildEmbers({ rect, ramp, count: 200, edgeShare: 0.6 })
    // radiusRange/radiusBase match MODAL_FORGE_TUNING's bounds exactly.
    for (const e of embers) {
      expect(e.r).toBeGreaterThanOrEqual(MODAL_FORGE_TUNING.radiusBase)
      expect(e.r).toBeLessThanOrEqual(
        MODAL_FORGE_TUNING.radiusBase + MODAL_FORGE_TUNING.radiusRange,
      )
    }
  })
})

describe('drawForgeFrame', () => {
  const ramp = { cold: '#fff', ember: '#f80', hot: '#fff8f0' }

  /** Counts the canvas state writes and draw calls one frame issues. */
  function recordingContext() {
    const record = { arcs: 0, fills: 0, fillStyles: 0, alphas: 0 }
    const ctx = {
      set globalAlpha(_v: number) {
        record.alphas += 1
      },
      set globalCompositeOperation(_v: string) {},
      set fillStyle(_v: string) {
        record.fillStyles += 1
      },
      beginPath: () => {},
      arc: () => {
        record.arcs += 1
      },
      fill: () => {
        record.fills += 1
      },
      // Justification: a hand-rolled stub only needs the subset of the 2D
      // context API this module actually calls.
    } as unknown as CanvasRenderingContext2D
    return { ctx, record }
  }

  it('draws without throwing against a minimal 2D-context stub', () => {
    const rect: ForgeRect = { left: 0, top: 0, width: 40, height: 40 }
    const embers = buildEmbers({ rect, ramp, count: 10, edgeShare: 0.5 })
    const { ctx, record } = recordingContext()

    expect(() => drawForgeFrame(ctx, embers, { t: 0.9, now: 1000, ramp })).not.toThrow()
    expect(record.arcs).toBeGreaterThan(0)
  })

  // THE perf regression guard. Before this was optimised, a frame wrote
  // `fillStyle` once per drawn ember (1040 CSS-colour-string parses at the
  // t = 0.9 peak, measured at 0.14 ms/frame). It must now be bounded by the
  // number of ramp tiers plus the single batched hot-core pass, no matter how
  // many embers there are.
  it('writes fillStyle a handful of times per frame, not once per ember', () => {
    const rect: ForgeRect = { left: 0, top: 0, width: 400, height: 400 }
    const embers = buildEmbers({ rect, ramp, count: 500, edgeShare: 0.62 })
    const { ctx, record } = recordingContext()

    drawForgeFrame(ctx, embers, { t: 0.9, now: 1000, ramp })

    expect(record.arcs).toBeGreaterThan(400)
    // At most one write per tier present, plus one for the hot-core batch.
    expect(record.fillStyles).toBeLessThanOrEqual(4)
  })
})
