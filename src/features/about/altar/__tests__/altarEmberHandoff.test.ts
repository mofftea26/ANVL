import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MODAL_FORGE_TUNING } from '@/shared/lib/forge/emberForge'
import {
  deriveSwarmSpreadScale,
  projectSeatToViewport,
  useAltarEmberHandoff,
} from '../altarEmberHandoff'

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

/**
 * The hand-off's arm -> launch -> retire path. This is the logic that live
 * verification cannot reach in this environment (the altar's cinematic needs a
 * compositing browser), and the timing module's tests only pin relationships
 * between exported constants — they would still pass if the swarm were never
 * armed or never launched. These are the tests that catch that.
 */
describe('useAltarEmberHandoff', () => {
  /** The seat as SeatProjector reports it at 1440x900 (measured in-app). */
  const SEAT = { x: 0, y: -0.0878, radius: 0.42 }
  /** The altar panel's natural rect, as measured in the running app. */
  const PANEL = { left: 384, top: 98, width: 672, height: 704 }

  function panelRect(): DOMRect {
    return {
      ...PANEL,
      right: PANEL.left + PANEL.width,
      bottom: PANEL.top + PANEL.height,
      x: PANEL.left,
      y: PANEL.top,
    } as DOMRect
  }

  function setup(reducedMotion = false) {
    const canvasBox = { current: boxOf(0, 0, 1440, 900) }
    return renderHook(() =>
      useAltarEmberHandoff({
        state: { seatNdc: { ...SEAT } },
        orbs: [{ color: '#E08A4A' }, { color: '   ' }],
        reducedMotion,
        canvasBox,
      }),
    )
  }

  it('mounts nothing until a strike arms it AND the panel reports its rect', () => {
    const { result } = setup()
    expect(result.current.swarm).toBeNull()

    // Armed at the hand-off beat — still nothing to render (no rect yet).
    act(() => result.current.armSwarm(0))
    expect(result.current.swarm).toBeNull()

    // The panel's measure launches it.
    act(() => result.current.handlePanelMeasure(panelRect()))
    expect(result.current.swarm).not.toBeNull()
  })

  it('launches exactly one swarm, tinted, with a defined origin and spreadScale', () => {
    const { result } = setup()
    act(() => {
      result.current.armSwarm(0)
      result.current.handlePanelMeasure(panelRect())
    })

    const swarm = result.current.swarm
    expect(swarm?.tint).toBe('#E08A4A')
    // Seat NDC x = 0 is the horizontal centre of the 1440-wide canvas box.
    expect(swarm?.origin?.x).toBeCloseTo(720)
    expect(swarm?.origin?.y).toBeGreaterThan(0)
    // Pulled well inside the canonical ring, onto the in-canvas shroud.
    expect(swarm?.spreadScale).toBeGreaterThan(0.15)
    expect(swarm?.spreadScale).toBeLessThan(1)

    // A second measure (a re-render, a resize report) must not start a new pass.
    const first = result.current.swarm
    act(() => result.current.handlePanelMeasure(panelRect()))
    expect(result.current.swarm).toBe(first)
  })

  it('gives each strike a fresh key so the pass restarts', () => {
    const { result } = setup()
    act(() => {
      result.current.armSwarm(0)
      result.current.handlePanelMeasure(panelRect())
    })
    const first = result.current.swarm?.key
    act(() => {
      result.current.resetSwarm()
      result.current.armSwarm(0)
      result.current.handlePanelMeasure(panelRect())
    })
    expect(result.current.swarm?.key).not.toBe(first)
  })

  it('falls back to the site ember ramp for an orb with no colour', () => {
    const { result } = setup()
    act(() => {
      result.current.armSwarm(1)
      result.current.handlePanelMeasure(panelRect())
    })
    expect(result.current.swarm).not.toBeNull()
    expect(result.current.swarm?.tint).toBeUndefined()
  })

  it('arms nothing under reduced motion, so no swarm is ever mounted', () => {
    const { result } = setup(true)
    act(() => {
      result.current.armSwarm(0)
      result.current.handlePanelMeasure(panelRect())
    })
    expect(result.current.swarm).toBeNull()
  })

  it('retires the pass when it lands, and when the modal closes', () => {
    const { result } = setup()
    act(() => {
      result.current.armSwarm(0)
      result.current.handlePanelMeasure(panelRect())
    })
    act(() => result.current.retireSwarm())
    expect(result.current.swarm).toBeNull()

    act(() => {
      result.current.armSwarm(0)
      result.current.handlePanelMeasure(panelRect())
    })
    act(() => result.current.resetSwarm())
    expect(result.current.swarm).toBeNull()
  })

  it('hands ForgeEmberCanvas the measured rect, and drops it on close', () => {
    const { result } = setup()
    expect(result.current.swarmRect()).toBeNull()
    act(() => result.current.handlePanelMeasure(panelRect()))
    expect(result.current.swarmRect()).toEqual(PANEL)
    // A closed modal returns null, which ends any in-flight pass.
    act(() => result.current.resetSwarm())
    expect(result.current.swarmRect()).toBeNull()
  })

  it('closing mid-strike disarms, so a stale capture cannot launch later', () => {
    const { result } = setup()
    act(() => result.current.armSwarm(0))
    act(() => result.current.resetSwarm())
    act(() => result.current.handlePanelMeasure(panelRect()))
    expect(result.current.swarm).toBeNull()
  })
})
