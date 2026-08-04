import { describe, expect, it } from 'vitest'
import {
  markerPlacement,
  placeOnRegion,
  placementSide,
  resolveStageRegion,
} from '../markerGeometry'

/**
 * The accuracy core the three placed-readout effects share. A marker the CMS
 * user clicked on the sleeve has to reach the sleeve on every stage, so the
 * conversion is tested on its own rather than through three animations.
 */

const [VIEW_W, VIEW_H] = [400, 500]

describe('markerPlacement', () => {
  it('reads an authored coordinate', () => {
    expect(markerPlacement({ x: 12.5, y: 80 })).toEqual({ x: 12.5, y: 80 })
  })

  it('clamps a coordinate that would park the readout off-image', () => {
    expect(markerPlacement({ x: -30, y: 140 })).toEqual({ x: 0, y: 100 })
  })

  it('reports NO placement for an unplaced marker, so the caller can fall back', () => {
    // The three shapes an "unplaced" marker can arrive in: the nullable
    // discriminator, an absent field, and a number that is not one.
    expect(markerPlacement({ x: null, y: null })).toBeNull()
    expect(markerPlacement({})).toBeNull()
    expect(markerPlacement({ x: Number.NaN, y: 40 })).toBeNull()
    // A half-placed marker is not a placement either — the pair is the datum.
    expect(markerPlacement({ x: 30, y: null })).toBeNull()
  })
})

describe('resolveStageRegion', () => {
  it('uses the MEASURED contain-rect, recovering the box from its centering', () => {
    // A 300x400 image letterboxed inside a 400x400 box: 50px bars left/right.
    const region = resolveStageRegion(
      { left: 50, top: 0, width: 300, height: 400 },
      undefined,
      VIEW_W,
      VIEW_H,
    )
    expect(region).toEqual({ x: 50, y: 0, w: 300, h: 500 })
  })

  it('ignores a rect flush with its box — that is the hook saying "not decoded"', () => {
    // Flush + a known aspect ⇒ aspect math wins. 1:1 inside 4:5 ⇒ pillarless
    // square, centred vertically.
    const region = resolveStageRegion({ left: 0, top: 0, width: 400, height: 500 }, 1, VIEW_W, VIEW_H)
    expect(region).toEqual({ x: 0, y: 50, w: 400, h: 400 })
  })

  it('falls back to the garment inset when nothing about the image is known', () => {
    expect(resolveStageRegion(null, undefined, VIEW_W, VIEW_H)).toEqual({
      x: 52,
      y: 65,
      w: 296,
      h: 370,
    })
  })
})

describe('placeOnRegion / placementSide', () => {
  const region = { x: 50, y: 0, w: 300, h: 500 }

  it('resolves a percent of the IMAGE, not of the stage box', () => {
    // 50% across a region that starts at x=50 is 200, NOT the box's own 200
    // by coincidence — check a point where the two genuinely differ.
    expect(placeOnRegion({ x: 0, y: 0 }, region)).toEqual({ x: 50, y: 0 })
    expect(placeOnRegion({ x: 100, y: 100 }, region)).toEqual({ x: 350, y: 500 })
    expect(placeOnRegion({ x: 25, y: 40 }, region)).toEqual({ x: 125, y: 200 })
  })

  it('sends a readout to the nearer stage edge', () => {
    expect(placementSide({ x: 20, y: 50 })).toBe(-1)
    expect(placementSide({ x: 80, y: 50 })).toBe(1)
  })
})
