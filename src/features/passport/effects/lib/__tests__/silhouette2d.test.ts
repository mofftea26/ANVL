import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildSilhouetteSample2D,
  containedRect,
  sampleSilhouette2D,
} from '../silhouette2d'

/** Synthetic RGBA raster: opaque alpha on the given row spans, 0 elsewhere. */
function alphaGrid(
  w: number,
  h: number,
  rows: Array<{ y: number; x0: number; x1: number }>,
  alpha = 255,
) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (const r of rows) {
    for (let x = r.x0; x <= r.x1; x += 1) data[(r.y * w + x) * 4 + 3] = alpha
  }
  return data
}

/** A 14×18 solid rectangle on a 20×20 grid — the well-formed garment stand-in.
 *  Square grid on purpose: arc-length evenness survives normalization. */
const rectRows = () => Array.from({ length: 18 }, (_, i) => ({ y: i + 1, x0: 3, x1: 16 }))

/**
 * jsdom never decodes images (onload/onerror both stay silent forever). This
 * stand-in fails the decode on the next microtask so the loader's failure
 * ladder is what the async tests exercise — the pure core carries the rest.
 */
class FailingImage {
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildSilhouetteSample2D (the pure core, fed synthetic pixels)', () => {
  it('reads per-row silhouette edges, the mask, and the garment span', () => {
    const sample = buildSilhouetteSample2D(alphaGrid(20, 20, rectRows()), 20, 20, 1)
    expect(sample).not.toBeNull()
    if (!sample) return
    expect(sample.maskWidth).toBe(20)
    expect(sample.maskHeight).toBe(20)
    expect(sample.aspect).toBeCloseTo(1)
    // Row 5 is opaque across x 3..16 → left 0.15, exclusive right 0.85.
    expect(sample.rows[5]).not.toBeNull()
    expect(sample.rows[5]?.left).toBeCloseTo(0.15)
    expect(sample.rows[5]?.right).toBeCloseTo(0.85)
    // Empty rows are null — the band shows no intercepts there.
    expect(sample.rows[0]).toBeNull()
    expect(sample.rows[19]).toBeNull()
    // Garment span: first populated row 1, last row 18.
    expect(sample.rows.findIndex((r) => r !== null)).toBe(1)
    expect(sample.rows.length - 1 - [...sample.rows].reverse().findIndex((r) => r !== null)).toBe(18)
    // The occupancy mask registers the same pixels.
    expect(sample.mask[5 * 20 + 5]).toBe(1)
    expect(sample.mask[0]).toBe(0)
  })

  it('produces an ordered, closed, evenly resampled outline', () => {
    const sample = buildSilhouetteSample2D(alphaGrid(20, 20, rectRows()), 20, 20, 1, {
      outlinePoints: 64,
    })
    expect(sample).not.toBeNull()
    if (!sample) return
    const pts = sample.outline
    expect(pts).toHaveLength(64)
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(1)
    }
    // Consecutive gaps (wrap included, so the loop is CLOSED) all hover near
    // the mean — ordered traversal at even arc length, no jumps, no stalls.
    const gaps = pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length]
      return Math.hypot(q.x - p.x, q.y - p.y)
    })
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
    expect(mean).toBeGreaterThan(0)
    for (const g of gaps) {
      expect(g).toBeGreaterThan(mean * 0.5)
      expect(g).toBeLessThan(mean * 1.5)
    }
    // The loop hugs the actual shape: its bounds sit on the rectangle's
    // pixel-center edges (x 3.5..16.5, y 1.5..18.5 over a 20-cell grid).
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    expect(Math.min(...xs)).toBeCloseTo(0.175, 1)
    expect(Math.max(...xs)).toBeCloseTo(0.825, 1)
    expect(Math.min(...ys)).toBeCloseTo(0.075, 1)
    expect(Math.max(...ys)).toBeCloseTo(0.925, 1)
  })

  it('computes the centroid as the mean of opaque pixel centers', () => {
    const sample = buildSilhouetteSample2D(alphaGrid(20, 20, rectRows()), 20, 20, 1)
    expect(sample?.centroid.x).toBeCloseTo(0.5)
    expect(sample?.centroid.y).toBeCloseTo(0.5)
  })

  it('keeps null rows across an interior gap while both bands read intercepts', () => {
    const bands = [
      ...Array.from({ length: 14 }, (_, i) => ({ y: i + 2, x0: 4, x1: 35 })),
      ...Array.from({ length: 14 }, (_, i) => ({ y: i + 20, x0: 4, x1: 35 })),
    ]
    const sample = buildSilhouetteSample2D(alphaGrid(40, 40, bands), 40, 40, 1)
    expect(sample).not.toBeNull()
    if (!sample) return
    expect(sample.rows[17]).toBeNull() // the gap between the bands
    expect(sample.rows[5]?.left).toBeCloseTo(0.1)
    expect(sample.rows[5]?.right).toBeCloseTo(0.9)
    expect(sample.rows[25]?.left).toBeCloseTo(0.1)
  })

  it('rejects rasters too sparse to be a garment', () => {
    const sample = buildSilhouetteSample2D(
      alphaGrid(10, 10, [
        { y: 2, x0: 4, x1: 5 },
        { y: 5, x0: 4, x1: 5 },
        { y: 8, x0: 4, x1: 5 },
      ]),
      10,
      10,
      1,
    )
    expect(sample).toBeNull()
  })

  it('rejects a pixel-rich raster whose silhouette spans almost no rows', () => {
    // 60 opaque pixels clear the pixel gate, but one populated row of 20 does
    // not read as a garment.
    const sample = buildSilhouetteSample2D(
      alphaGrid(60, 20, [{ y: 10, x0: 0, x1: 59 }]),
      60,
      20,
      3,
    )
    expect(sample).toBeNull()
  })

  it('rejects an opaque raster (a JPEG with no alpha silhouette)', () => {
    const sample = buildSilhouetteSample2D(
      alphaGrid(20, 20, Array.from({ length: 20 }, (_, y) => ({ y, x0: 0, x1: 19 }))),
      20,
      20,
      1,
    )
    expect(sample).toBeNull()
  })

  it('honours the alpha gate option', () => {
    const faint = alphaGrid(20, 20, rectRows(), 40) // below the default 48 gate
    expect(buildSilhouetteSample2D(faint, 20, 20, 1)).toBeNull()
    expect(buildSilhouetteSample2D(faint, 20, 20, 1, { alphaGate: 30 })).not.toBeNull()
  })
})

describe('sampleSilhouette2D (the async loader)', () => {
  it('resolves null for an empty url', async () => {
    await expect(sampleSilhouette2D('')).resolves.toBeNull()
  })

  it('resolves null — never rejects — when the image fails to decode', async () => {
    // Documented cast: the stand-in only implements the handler/src surface
    // the loader uses.
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)
    await expect(sampleSilhouette2D('https://cdn.test/piece.png')).resolves.toBeNull()
  })
})

describe('containedRect (object-contain letterbox math)', () => {
  it('letterboxes a wide image inside a tall box', () => {
    expect(containedRect(400, 500, 2)).toEqual({ x: 0, y: 150, w: 400, h: 200 })
  })

  it('pillarboxes a tall image inside a wide box', () => {
    expect(containedRect(600, 300, 0.5)).toEqual({ x: 225, y: 0, w: 150, h: 300 })
  })

  it('fills the box exactly when the aspects match', () => {
    expect(containedRect(400, 500, 4 / 5)).toEqual({ x: 0, y: 0, w: 400, h: 500 })
  })

  it('degrades an invalid aspect to a centered square', () => {
    expect(containedRect(300, 200, Number.NaN)).toEqual({ x: 50, y: 0, w: 200, h: 200 })
  })
})
