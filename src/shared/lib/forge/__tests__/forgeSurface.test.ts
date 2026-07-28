/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { buildEmbers, FORGE_EMBER_GROWTH, type ForgeRect } from '@/shared/lib/forge/emberForge'
import {
  clampBoxToViewport,
  containsBox,
  FORGE_MAX_DPR,
  forgeSwarmBounds,
  unionBox,
} from '@/shared/lib/forge/forgeSurface'

const RAMP = { cold: '#fff', ember: '#f80', hot: '#fff8f0' }

describe('forgeSwarmBounds', () => {
  const rect: ForgeRect = { left: 300, top: 120, width: 400, height: 500 }

  // The canvas is sized to this box and clears only it, so anything the box
  // misses is a clipped ember. Walk a real swarm rather than trusting the maths.
  it('contains every ember’s launch point, landing point and drawn radius', () => {
    for (const spreadScale of [1, 0.35]) {
      const origin = { x: 480, y: 300 }
      const embers = buildEmbers({
        rect,
        origin,
        ramp: RAMP,
        count: 300,
        edgeShare: 0.62,
        spreadScale,
      })
      const box = forgeSwarmBounds({ rect, origin, spreadScale })
      for (const e of embers) {
        const reach = e.r * (1 + FORGE_EMBER_GROWTH)
        for (const [x, y] of [
          [e.fx, e.fy],
          [e.tx, e.ty],
        ]) {
          expect(x - reach).toBeGreaterThanOrEqual(box.left)
          expect(y - reach).toBeGreaterThanOrEqual(box.top)
          expect(x + reach).toBeLessThanOrEqual(box.left + box.width)
          expect(y + reach).toBeLessThanOrEqual(box.top + box.height)
        }
      }
    }
  })

  it('shrinks with the launch ring — a tightened swarm needs far less surface', () => {
    const wide = forgeSwarmBounds({ rect, spreadScale: 1 })
    const tight = forgeSwarmBounds({ rect, spreadScale: 0.35 })
    expect(tight.width).toBeLessThan(wide.width)
    expect(tight.height).toBeLessThan(wide.height)
    // A tightened ring is bounded by the target rect it forms, not the ring.
    expect(tight.width).toBeGreaterThanOrEqual(rect.width)
    expect(tight.height).toBeGreaterThanOrEqual(rect.height)
  })

  it('never collapses on a degenerate spreadScale', () => {
    const box = forgeSwarmBounds({ rect, spreadScale: 0 })
    expect(box.width).toBeGreaterThan(rect.width)
    expect(box.height).toBeGreaterThan(rect.height)
  })

  it('caps the forge’s device pixel ratio below the usual 2', () => {
    expect(FORGE_MAX_DPR).toBeLessThan(2)
    expect(FORGE_MAX_DPR).toBeGreaterThan(1)
  })
})

describe('clampBoxToViewport', () => {
  it('trims a box that overhangs the viewport, in whole pixels', () => {
    const box = clampBoxToViewport({ left: -40.7, top: -10.2, width: 600, height: 400 }, 500, 300)
    expect(box).toEqual({ left: 0, top: 0, width: 500, height: 300 })
  })

  it('rounds outward so no ember lands on a half-covered pixel', () => {
    const box = clampBoxToViewport({ left: 10.6, top: 20.4, width: 100.2, height: 50.1 }, 500, 300)
    expect(box.left).toBe(10)
    expect(box.top).toBe(20)
    expect(box.left + box.width).toBeGreaterThanOrEqual(10.6 + 100.2)
    expect(box.top + box.height).toBeGreaterThanOrEqual(20.4 + 50.1)
  })

  it('reports a non-positive size for a box entirely off-screen', () => {
    const box = clampBoxToViewport({ left: 900, top: 0, width: 100, height: 100 }, 500, 300)
    expect(box.width).toBeLessThanOrEqual(0)
  })
})

describe('containsBox / unionBox', () => {
  const outer: ForgeRect = { left: 0, top: 0, width: 100, height: 100 }

  it('recognises containment, including exact edges', () => {
    expect(containsBox(outer, { left: 10, top: 10, width: 50, height: 50 })).toBe(true)
    expect(containsBox(outer, outer)).toBe(true)
    expect(containsBox(outer, { left: 60, top: 0, width: 50, height: 10 })).toBe(false)
    expect(containsBox(outer, { left: -1, top: 0, width: 10, height: 10 })).toBe(false)
  })

  it('grows to cover both boxes', () => {
    const box = unionBox(outer, { left: 80, top: -20, width: 60, height: 40 })
    expect(box).toEqual({ left: 0, top: -20, width: 140, height: 120 })
    expect(containsBox(box, outer)).toBe(true)
  })
})
