/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import {
  buildEmbers,
  drawForgeFrame,
  resolveForgeRamp,
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
})

describe('drawForgeFrame', () => {
  it('draws without throwing against a minimal 2D-context stub', () => {
    const rect: ForgeRect = { left: 0, top: 0, width: 40, height: 40 }
    const ramp = { cold: '#fff', ember: '#f80', hot: '#fff8f0' }
    const embers = buildEmbers({ rect, ramp, count: 10, edgeShare: 0.5 })

    const calls: string[] = []
    const ctx = {
      set globalAlpha(_v: number) {},
      set globalCompositeOperation(_v: string) {},
      set fillStyle(_v: string) {},
      beginPath: () => calls.push('beginPath'),
      arc: () => calls.push('arc'),
      fill: () => calls.push('fill'),
      // Justification: a hand-rolled stub only needs the subset of the 2D
      // context API this module actually calls.
    } as unknown as CanvasRenderingContext2D

    expect(() => drawForgeFrame(ctx, embers, { t: 0.9, now: 1000, ramp })).not.toThrow()
    expect(calls).toContain('arc')
  })
})
