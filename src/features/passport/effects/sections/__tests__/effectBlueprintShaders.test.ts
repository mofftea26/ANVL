import { describe, expect, it } from 'vitest'
import { TAG_HEIGHT, TAG_WIDTH, type HoloTagSpec } from '../../lib/holoTags'
import {
  CLOUD_LIFT,
  TAG_DRAW_HEIGHT,
  TAG_DRAW_WIDTH,
  TAG_RENDER_TRIM,
  buildProjectionData,
} from '../effectBlueprintShaders'

/**
 * The one piece of the hologram that is hard to get right by eye: turning a
 * marker's percent-of-the-image into a world height on a cloud that has been
 * re-centred on the garment's TIGHT bounds. Get it wrong and every plate on a
 * render with generous transparent padding drifts — which is exactly why the
 * mapping is asserted against numbers here rather than trusted to review.
 *
 * `effectBlueprintShaders` imports no three.js, so this runs in plain jsdom.
 */

/** The cloud fit `EffectBlueprintCanvas` samples with. */
const FIT = 3.2
const COUNT = 240
/** A roomy viewport, so a moved plate is the placement talking, not a clamp. */
const [VP_W, VP_H] = [6, 6]

/**
 * A synthetic garment sitting HIGH in its image box: the box spans ±1.6, the
 * cloud only y ∈ [0.2, 1.0]. Its own centre is therefore 0.6 above the box's,
 * which is the offset a naive tight-bounds mapping would silently swallow.
 */
function cloudInBox(x0: number, x1: number, y0: number, y1: number) {
  const positions = new Float32Array(COUNT * 3)
  const shades = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i += 1) {
    positions[i * 3] = i % 2 === 0 ? x0 : x1
    positions[i * 3 + 1] = y0 + ((y1 - y0) * i) / (COUNT - 1)
    shades[i] = 0.5
  }
  return { positions, shades }
}

const spec = (place: HoloTagSpec['place']): HoloTagSpec => ({ label: 'Cotton', value: '92%', place })

const project = (specs: HoloTagSpec[], box: { width: number; height: number } | null) =>
  buildProjectionData(cloudInBox(-0.5, 0.5, 0.2, 1.0), COUNT, VP_W, VP_H, specs, box)

describe('buildProjectionData — authored plate placement', () => {
  const box = { width: FIT, height: FIT }
  // The cloud's own recentre: bounds mid 0.6 down, then the emitter lift.
  const worldY = (percentY: number) => (0.5 - percentY / 100) * FIT - 0.6 + CLOUD_LIFT

  it('maps a marker through the IMAGE BOX, padding included', () => {
    const { layout } = project([spec({ x: 50, y: 50 })], box)
    expect(layout.tags[0].y).toBeCloseTo(worldY(50), 4)
  })

  it("places a marker in the render's padding above the garment, not on its hem", () => {
    const { layout } = project([spec({ x: 50, y: 0 })], box)
    // Tight-bounds mapping would have pinned this to the cloud's own top.
    expect(layout.tags[0].y).toBeGreaterThan(layout.maxY)
    expect(layout.tags[0].y).toBeCloseTo(worldY(0), 4)
  })

  it('reads the marker x for the rail side', () => {
    expect(project([spec({ x: 12, y: 50 })], box).layout.tags[0].x).toBeLessThan(0)
    expect(project([spec({ x: 88, y: 50 })], box).layout.tags[0].x).toBeGreaterThan(0)
  })

  it('falls back to the frozen slots without an image box or a placement', () => {
    const unplaced = project([spec(null)], box).layout.tags[0]
    const noBox = project([spec({ x: 12, y: 90 })], null).layout.tags[0]
    const placed = project([spec({ x: 12, y: 90 })], box).layout.tags[0]
    // An undecodable box takes the same slot as an unplaced marker, even
    // though this one carries coordinates — percent has no world to land in.
    expect(noBox.y).toBeCloseTo(unplaced.y, 4)
    expect(noBox.x).toBeCloseTo(unplaced.x, 4)
    // Slot 0 hangs on the RIGHT; the same marker, mapped, goes left and low.
    expect(unplaced.x).toBeGreaterThan(0)
    expect(placed.x).toBeLessThan(0)
    expect(placed.y).toBeLessThan(unplaced.y)
  })

  it('projects no plates at all when the passport authored none', () => {
    expect(project([], box).layout.tags).toEqual([])
  })
})

/**
 * The plate's drawn size. Reported as too big on the storefront passport and
 * trimmed — but only where it is DRAWN, because `layoutHoloTags` uses the
 * untrimmed size as its clearance budget and must keep doing so. The numbers
 * are pinned because a trim is a judgement call: nothing in the code says how
 * big is too big, so a test has to.
 */
describe('spec plates — drawn size vs layout budget', () => {
  it('draws the plates a restrained step smaller than they are budgeted', () => {
    expect(TAG_RENDER_TRIM).toBe(0.88)
    // A trim, not a redesign — the report was "a bit too big".
    expect(TAG_RENDER_TRIM).toBeGreaterThan(0.8)
    expect(TAG_RENDER_TRIM).toBeLessThan(1)
    expect(TAG_DRAW_WIDTH).toBeCloseTo(TAG_WIDTH * 0.88, 10)
    expect(TAG_DRAW_HEIGHT).toBeCloseTo(TAG_HEIGHT * 0.88, 10)
  })

  it('keeps the raster aspect, so the type cannot come out stretched', () => {
    expect(TAG_DRAW_WIDTH / TAG_DRAW_HEIGHT).toBeCloseTo(TAG_WIDTH / TAG_HEIGHT, 10)
  })

  it('stays inside the budget the layout solved for, never outside it', () => {
    // Every clamp and same-rail gap in `layoutHoloTags` is computed for the
    // larger plate, so a trimmed pair can only ever gain clearance.
    expect(TAG_DRAW_WIDTH).toBeLessThan(TAG_WIDTH)
    expect(TAG_DRAW_HEIGHT).toBeLessThan(TAG_HEIGHT)
  })
})
