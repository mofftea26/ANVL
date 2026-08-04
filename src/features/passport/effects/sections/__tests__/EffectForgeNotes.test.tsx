import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EffectForgeNotes from '../EffectForgeNotes'
import {
  archived,
  COUNTS,
  makeCorrection,
  makeRevision,
  NOTES,
  readNotePalette,
  strikeAcross,
  supersedeCurrent,
  toShape,
} from '../effectNotesRecord'
import { buildSilhouetteSample2D } from '../../lib/silhouette2d'
import type { PassportEffectProps } from '../../effectTypes'

/**
 * jsdom has no canvas implementation — `getContext('2d')` returns null — so
 * the 2D context is stubbed with exactly the surface "The Revision Stack"
 * draws with, plus an ordered op log and an ink log, so the two claims that
 * matter can be asserted: the archive arrives ALREADY STRUCK, and the stack
 * really shifts under the light between beats.
 *
 * jsdom also never decodes images, so every RENDERED path here exercises the
 * DESIGNED FALLBACK (sample null → stacked spec sheets); the garment-traced
 * revisions are pure math and are asserted directly against
 * `effectNotesRecord` with synthetic pixels, the pattern
 * `lib/__tests__/silhouette2d.test.ts` sets.
 */
type DrawOp = { op: 'moveTo' | 'lineTo'; x: number; y: number }

function createCtxStub() {
  const ops: DrawOp[] = []
  const inks: string[] = []
  let ink = ''
  return {
    ops,
    inks,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn((x: number, y: number) => void ops.push({ op: 'moveTo', x, y })),
    lineTo: vi.fn((x: number, y: number) => void ops.push({ op: 'lineTo', x, y })),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    globalAlpha: 1,
    lineWidth: 1,
    fillStyle: '',
    get strokeStyle() {
      return ink
    },
    set strokeStyle(value: string) {
      ink = value
      inks.push(value)
    },
  }
}
type CtxStub = ReturnType<typeof createCtxStub>

/** Replace the setup-file matchMedia mock so reduced-motion can be toggled. */
function stubMatchMedia(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(false),
    })),
  })
}

/**
 * jsdom's Image never fires onload/onerror, which would leave the silhouette
 * sample pending forever. This stand-in fails the decode on the next
 * microtask, so the resolving → sheets hand-off is observable and fast.
 */
class FailingImage {
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

/**
 * rAF handles in a Map, so `cancelAnimationFrame` genuinely removes them: the
 * reduced-motion assertion is that NOTHING is left scheduled, which a stub
 * that ignored cancellation could not prove.
 */
let rafStore: Map<number, FrameRequestCallback>

function installRafStore() {
  rafStore = new Map()
  let id = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    rafStore.set((id += 1), cb)
    return id
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle: number) => {
    rafStore.delete(handle)
  })
}

function drainFrames(at: number) {
  const pending = [...rafStore.values()]
  rafStore.clear()
  act(() => {
    for (const cb of pending) cb(at)
  })
}

/** A 14×18 solid rectangle on a 20×20 grid — the well-formed garment stand-in. */
function rectSample() {
  const data = new Uint8ClampedArray(20 * 20 * 4)
  for (let y = 1; y <= 18; y += 1)
    for (let x = 3; x <= 16; x += 1) data[(y * 20 + x) * 4 + 3] = 255
  const sample = buildSilhouetteSample2D(data, 20, 20, 1, { outlinePoints: 128 })
  if (!sample) throw new Error('fixture is not a traceable silhouette')
  return sample
}

const BASE_PROPS: PassportEffectProps = {
  sectionKey: 'forge-notes',
  imageUrl: null,
  tier: 'console',
}

describe('EffectForgeNotes', () => {
  let ctx: CtxStub

  beforeEach(() => {
    ctx = createCtxStub()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      // Documented cast: the stub covers the exact 2D API the effect calls;
      // jsdom offers no real context that could satisfy the full interface.
      ctx as unknown as CanvasRenderingContext2D,
    )
    // The layer is absolutely positioned — give it a real console-ish box so
    // the size guards (< 2px skips drawing) do not blank every assertion.
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 416,
      height: 520,
      top: 0,
      left: 0,
      right: 416,
      bottom: 520,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('opens on a struck archive within the first second, and tears down completely', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { container, unmount } = render(<EffectForgeNotes {...BASE_PROPS} />)
    const canvas = container.querySelector('canvas')
    // No image → no contour: the designed stacked-sheets record, live.
    expect(canvas).toHaveAttribute('data-notes-mode', 'sheets')
    expect(canvas).toHaveAttribute('data-motion', 'live')
    expect(rafSpy).toHaveBeenCalledTimes(1)

    const frameCb = rafSpy.mock.calls[0]?.[0]
    expect(frameCb).toBeDefined()
    frameCb?.(16)
    expect(rafSpy).toHaveBeenCalledTimes(2) // the loop re-arms itself

    // dt clamps at 64ms, so 10 frames ≈ 0.64s — well inside the first second.
    let tMs = 16
    for (let i = 0; i < 10; i += 1) {
      tMs += 64
      frameCb?.(tMs)
    }
    const pal = readNotePalette()
    // The record opens on HISTORY: cross-outs are ember, and they are on
    // screen immediately rather than eight seconds in.
    expect(ctx.inks).toContain(pal.ember)
    expect(ctx.inks).toContain(pal.bone) // …and the pen is drawing the current
    // No arcs, no fills anywhere: this section is line work. The burning nib
    // (an ember disc + halo) belongs to the chronicle, not to a workbook.
    expect(ctx.arc).not.toHaveBeenCalled()
    expect(ctx.fill).not.toHaveBeenCalled()

    unmount()
    // Total teardown: rAF cancelled, every visibility hook removed.
    expect(cancelSpy).toHaveBeenCalledWith(7)
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    const visRemoves = removeSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBeGreaterThanOrEqual(1)
    expect(visRemoves).toBe(visAdds)
  })

  it('keeps the stack shifting under the light between beats', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    render(<EffectForgeNotes {...BASE_PROPS} />)
    const frameCb = rafSpy.mock.calls[0]?.[0]
    // Run to t ≈ 1.92s: the pen lap is complete (0.3 → +1.6), the first
    // correction is not due until 2.1, and the first revise not until 5.3.
    // Anything that moves in this window is the sheets' own idle.
    let tMs = 16
    frameCb?.(tMs)
    for (let i = 0; i < 30; i += 1) {
      tMs += 64
      frameCb?.(tMs)
    }
    ctx.ops.length = 0
    tMs += 64
    frameCb?.(tMs)
    const a = ctx.ops.map((o) => ({ ...o }))
    ctx.ops.length = 0
    tMs += 64
    frameCb?.(tMs)
    const b = ctx.ops

    // Identical composition, one frame apart…
    expect(a.length).toBeGreaterThan(COUNTS.console.revisions * 100)
    expect(b).toHaveLength(a.length)
    // …drawn in a different PLACE. The idle is real translation, not an alpha
    // wobble on 1px lines, which is what a still frame used to be.
    const shift = a.reduce((sum, op, i) => sum + Math.abs(op.x - b[i].x) + Math.abs(op.y - b[i].y), 0)
    expect(shift).toBeGreaterThan(1)
  })

  it('waits dark while sampling, then degrades to spec sheets when the decode fails', async () => {
    // Documented cast: the stand-in implements only the handler/src surface
    // the sampler's loader uses.
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const { container, unmount } = render(
      <EffectForgeNotes {...BASE_PROPS} imageUrl="https://cdn.test/notes.png" />,
    )
    const canvas = container.querySelector('canvas')
    // Sampling in flight: the layer waits dark — no clock, no drawing yet.
    expect(canvas).toHaveAttribute('data-notes-mode', 'resolving')
    expect(rafSpy).not.toHaveBeenCalled()

    // Flush the failed decode → null sample → the designed fallback arms.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(canvas).toHaveAttribute('data-notes-mode', 'sheets')
    expect(rafSpy).toHaveBeenCalledTimes(1)
    rafSpy.mock.calls[0]?.[0]?.(16)
    expect(ctx.stroke).toHaveBeenCalled()
    expect(() => unmount()).not.toThrow()
  })

  it('mounts and unmounts cleanly on the sheet tier, at exactly half the elements', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(9)
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const { container, unmount } = render(<EffectForgeNotes {...BASE_PROPS} tier="sheet" />)
    expect(container.querySelector('canvas')).toHaveAttribute('data-notes-mode', 'sheets')
    rafSpy.mock.calls[0]?.[0]?.(16)
    expect(ctx.stroke).toHaveBeenCalled()

    // Half the record on the sheet, element for element — two revisions is
    // the floor at which a stack still reads as a stack.
    expect(COUNTS.sheet.revisions * 2).toBe(COUNTS.console.revisions)
    expect(COUNTS.sheet.corrections * 2).toBe(COUNTS.console.corrections)
    expect(COUNTS.sheet.tally * 2).toBe(COUNTS.console.tally)

    unmount()
    expect(cancelSpy).toHaveBeenCalledWith(9)
    expect(() => rafSpy.mock.calls[0]?.[0]?.(999)).not.toThrow()
  })

  it('renders a still, authored record under reduced motion — and no clock', () => {
    stubMatchMedia(true)
    // useReducedMotion flips to true in an effect, so a live loop may start
    // for one tick before the still branch takes over. The store-backed rAF
    // honours cancellation, so "no clock" is provable rather than assumed.
    installRafStore()

    const { container, unmount } = render(<EffectForgeNotes {...BASE_PROPS} tier="sheet" />)
    expect(container.querySelector('canvas')).toHaveAttribute('data-motion', 'still')
    // The still paints synchronously: the struck archive, the current attempt
    // on top, one correction held with its verdict, the tally. All line work.
    expect(ctx.stroke).toHaveBeenCalled()
    expect(ctx.inks).toContain(readNotePalette().ember) // struck, and rejected
    expect(ctx.arc).not.toHaveBeenCalled()
    expect(ctx.fill).not.toHaveBeenCalled()

    // The transient live start was cancelled: nothing is scheduled, and
    // draining the (now empty) queue paints nothing more.
    expect(rafStore.size).toBe(0)
    const strokes = ctx.stroke.mock.calls.length
    drainFrames(999)
    expect(ctx.stroke.mock.calls.length).toBe(strokes)
    expect(() => unmount()).not.toThrow()
  })

  it('stays inert when the 2D context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    const addSpy = vi.spyOn(document, 'addEventListener')

    const { unmount } = render(<EffectForgeNotes {...BASE_PROPS} />)
    expect(rafSpy).not.toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBe(0)
    expect(() => unmount()).not.toThrow()
  })
})

describe('the record model', () => {
  it('strikes a superseded attempt across its own bounds', () => {
    // The cross-out is geometry, not decoration: it must span the attempt it
    // rejects, entering and leaving past its edges.
    const rev = makeRevision(0, false, null)
    const [x1, y1, x2, y2] = strikeAcross(rev.loop)
    expect(x1).toBeLessThan(rev.loop.minX)
    expect(x2).toBeGreaterThan(rev.loop.maxX)
    for (const y of [y1, y2]) {
      expect(y).toBeGreaterThanOrEqual(rev.loop.minY)
      expect(y).toBeLessThanOrEqual(rev.loop.maxY)
    }
    expect(y2).toBeGreaterThan(y1) // a hand's diagonal, never a ruled line
  })

  it('strikes exactly one attempt per revision, never the whole stack at once', () => {
    // The mount stack is HISTORY, seeded already superseded. Left "current",
    // every seeded sheet was struck simultaneously on the first revise —
    // four cross-outs popping together, the composition contradicting its own
    // narrative on its loudest beat.
    const stack = Array.from({ length: COUNTS.console.revisions }, (_, k) =>
      makeRevision(k * NOTES.ghostStagger, k === COUNTS.console.revisions - 1, null),
    )
    for (let k = 0; k < stack.length - 1; k += 1) archived(stack[k], stack[k].born)
    expect(stack.filter((r) => r.strike !== null)).toHaveLength(stack.length - 1)
    expect(stack[stack.length - 1].strike).toBeNull()

    expect(supersedeCurrent(stack, 5)).toBe(1)
    expect(stack[stack.length - 1].strike).not.toBeNull()
    expect(stack[stack.length - 1].strikeAt).toBe(5)
    // The archive keeps its own strike times — no burst.
    for (let k = 0; k < stack.length - 1; k += 1) expect(stack[k].strikeAt).toBe(stack[k].born)
    // Every sheet aged one rank, and the next revise has nothing left to strike.
    expect(stack.every((r) => r.rank === 1)).toBe(true)
    expect(supersedeCurrent(stack, 10)).toBe(0)
  })

  it('re-traces the same piece with fresh deviations, never the same sheet twice', () => {
    const shape = toShape(rectSample())
    const a = makeRevision(0, true, shape).loop.pts
    const b = makeRevision(0, true, shape).loop.pts
    expect(a).toHaveLength(shape.pts.length)

    let identical = true
    let maxDev = 0
    for (let i = 0; i < a.length; i += 2) {
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1]) identical = false
      maxDev = Math.max(maxDev, Math.hypot(a[i] - shape.pts[i], a[i + 1] - shape.pts[i + 1]))
    }
    expect(identical).toBe(false) // two attempts are two attempts
    // Wide enough that stacked sheets read as separate attempts rather than a
    // blur halo (the whole point of the stack)…
    expect(maxDev).toBeGreaterThan(0.006)
    // …and tight enough that every sheet is still THIS garment.
    expect(maxDev).toBeLessThan(0.09)
  })

  it('holds the superseded edge against the one that replaced it', () => {
    const shape = toShape(rectSample())
    const next = makeRevision(1, true, shape).loop
    const prev = makeRevision(0, false, shape).loop
    const cor = makeCorrection(2, next, prev, shape.cx, shape.cy)
    expect(cor).not.toBeNull()
    if (!cor) return

    // Two versions of the SAME span of the contour, point for point…
    expect(cor.next.length).toBe(cor.prev.length)
    expect(cor.prev.length / 2).toBeGreaterThanOrEqual(6)
    let apart = 0
    for (let i = 0; i < cor.prev.length; i += 2)
      apart = Math.max(apart, Math.hypot(cor.next[i] - cor.prev[i], cor.next[i + 1] - cor.prev[i + 1]))
    expect(apart).toBeGreaterThan(0) // …that genuinely differ — the correction
    // The discard direction points out of the piece, so the old edge is
    // thrown clear of it rather than through it.
    expect(Math.hypot(cor.nx, cor.ny)).toBeCloseTo(1, 5)
  })
})
