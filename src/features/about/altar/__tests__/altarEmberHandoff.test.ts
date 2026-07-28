import { describe, expect, it } from 'vitest'
import { projectSeatToViewport } from '../altarEmberHandoff'

/** A stand-in for the altar's canvas box (jsdom reports zeroes for real nodes). */
function boxOf(left: number, top: number, width: number, height: number): HTMLElement {
  const el = document.createElement('div')
  el.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect
  return el
}

describe('projectSeatToViewport', () => {
  it('maps NDC centre to the canvas box centre', () => {
    expect(projectSeatToViewport(boxOf(0, 0, 1280, 800), { x: 0, y: 0 })).toEqual({
      x: 640,
      y: 400,
    })
  })

  it('flips the y axis (NDC is y-up, the viewport is y-down)', () => {
    const box = boxOf(0, 0, 1280, 800)
    // Top of the canvas in NDC (+1) must be y = 0 in viewport pixels.
    expect(projectSeatToViewport(box, { x: -1, y: 1 })).toEqual({ x: 0, y: 0 })
    // Bottom (-1) must be the far edge.
    expect(projectSeatToViewport(box, { x: 1, y: -1 })).toEqual({ x: 1280, y: 800 })
  })

  it('offsets by the canvas box, so the origin is in viewport coordinates', () => {
    // The swarm canvas is `fixed inset-0`, so an offset stage must not shift
    // the origin out from under the embers.
    expect(projectSeatToViewport(boxOf(40, 64, 1200, 700), { x: 0, y: 0 })).toEqual({
      x: 640,
      y: 414,
    })
  })

  it('falls back to undefined without a canvas or with a zero-sized one', () => {
    expect(projectSeatToViewport(null, { x: 0, y: 0 })).toBeUndefined()
    expect(projectSeatToViewport(boxOf(0, 0, 0, 0), { x: 0, y: 0 })).toBeUndefined()
  })
})
