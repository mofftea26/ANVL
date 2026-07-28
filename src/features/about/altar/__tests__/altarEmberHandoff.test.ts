import { describe, expect, it } from 'vitest'
import { MODAL_FORGE_TUNING } from '@/shared/lib/forge/emberForge'
import { deriveSwarmSpreadScale, projectSeatToViewport } from '../altarEmberHandoff'

/** A stand-in for the altar's canvas box (jsdom reports zeroes for real nodes). */
function boxOf(left: number, top: number, width: number, height: number): HTMLElement {
  const el = document.createElement('div')
  el.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect
  return el
}

describe('projectSeatToViewport', () => {
  it('maps NDC centre to the canvas box centre', () => {
    expect(
      projectSeatToViewport(boxOf(0, 0, 1280, 800), { x: 0, y: 0, radius: 0 })?.origin,
    ).toEqual({ x: 640, y: 400 })
  })

  it('flips the y axis (NDC is y-up, the viewport is y-down)', () => {
    const box = boxOf(0, 0, 1280, 800)
    // Top of the canvas in NDC (+1) must be y = 0 in viewport pixels.
    expect(projectSeatToViewport(box, { x: -1, y: 1, radius: 0 })?.origin).toEqual({ x: 0, y: 0 })
    // Bottom (-1) must be the far edge.
    expect(projectSeatToViewport(box, { x: 1, y: -1, radius: 0 })?.origin).toEqual({
      x: 1280,
      y: 800,
    })
  })

  it('offsets by the canvas box, so the origin is in viewport coordinates', () => {
    // The swarm canvas is `fixed inset-0`, so an offset stage must not shift
    // the origin out from under the embers.
    expect(
      projectSeatToViewport(boxOf(40, 64, 1200, 700), { x: 0, y: 0, radius: 0 })?.origin,
    ).toEqual({ x: 640, y: 414 })
  })

  it('converts the shroud radius to pixels across the box width (NDC x spans 2)', () => {
    // Half an NDC unit of radius is a quarter of the box's width.
    expect(
      projectSeatToViewport(boxOf(0, 0, 1280, 800), { x: 0, y: 0, radius: 0.5 })?.shroudOuterPx,
    ).toBe(320)
  })

  it('falls back to undefined without a canvas or with a zero-sized one', () => {
    expect(projectSeatToViewport(null, { x: 0, y: 0, radius: 0.5 })).toBeUndefined()
    expect(projectSeatToViewport(boxOf(0, 0, 0, 0), { x: 0, y: 0, radius: 0.5 })).toBeUndefined()
  })
})

describe('deriveSwarmSpreadScale', () => {
  /** The altar panel as actually measured in the running app at 1440×900. */
  const panel = { left: 384, top: 98, width: 672, height: 704 }
  const outerFactor = MODAL_FORGE_TUNING.spreadBase + MODAL_FORGE_TUNING.spreadRange

  it('lands the launch ring’s outer edge on the shroud’s outer edge', () => {
    const shroudOuterPx = 300
    const scale = deriveSwarmSpreadScale(shroudOuterPx, panel)
    // The engine launches its widest ember at reach * outerFactor * scale.
    const reach = Math.max(panel.width, panel.height)
    expect(reach * outerFactor * scale).toBeCloseTo(shroudOuterPx)
  })

  it('is well inside the canonical ring for the altar’s measured geometry', () => {
    // Canonical (scale 1) launches the widest ember ~880px out while the shroud
    // only reaches ~300px — the mismatch this exists to close.
    const scale = deriveSwarmSpreadScale(300, panel)
    expect(scale).toBeGreaterThan(0.15)
    expect(scale).toBeLessThan(0.5)
  })

  it('never exceeds the canonical ring, and never collapses to a point', () => {
    // A shroud wider than the panel must not blow the ring past the modal's own.
    expect(deriveSwarmSpreadScale(5000, panel)).toBe(1)
    // A near-zero measurement must not stack every ember on the origin.
    expect(deriveSwarmSpreadScale(0.0001, panel)).toBeGreaterThanOrEqual(0.15)
  })

  it('falls back to the canonical ring when an input is unusable', () => {
    expect(deriveSwarmSpreadScale(0, panel)).toBe(1)
    expect(deriveSwarmSpreadScale(Number.NaN, panel)).toBe(1)
    expect(deriveSwarmSpreadScale(300, { left: 0, top: 0, width: 0, height: 0 })).toBe(1)
  })
})
