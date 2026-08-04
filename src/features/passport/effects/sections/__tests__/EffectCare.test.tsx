import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EffectCare from '../EffectCare'
import { buildClothPanel, COUNTS, toCareShape } from '../effectCareCloth'
import { buildSilhouetteSample2D, type SilhouetteSample2D } from '../../lib/silhouette2d'
import type { PassportEffectProps } from '../../effectTypes'

/**
 * jsdom has no canvas implementation — `getContext('2d')` returns null — so
 * the 2D context is stubbed with exactly the surface "The Keeping" draws
 * with, plus an ordered op log so the PILE ITSELF can be asserted (a stub
 * that only counts `stroke()` calls is satisfied by the rim alone, and would
 * stay green with the whole field deleted).
 *
 * jsdom also never decodes images, so every RENDERED path here exercises the
 * DESIGNED FALLBACK (sample null → the folded cloth panel); the garment
 * registration — mask rejection-sampling, the claim that a hoodie and a sock
 * cannot look the same — is asserted directly against `effectCareCloth` with
 * synthetic pixels, the pattern `lib/__tests__/silhouette2d.test.ts` sets.
 */
type DrawOp = { op: 'moveTo' | 'lineTo'; x: number; y: number }

function createCtxStub() {
  const gradient = { addColorStop: vi.fn() }
  const ops: DrawOp[] = []
  return {
    ops,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn((x: number, y: number) => void ops.push({ op: 'moveTo', x, y })),
    lineTo: vi.fn((x: number, y: number) => void ops.push({ op: 'lineTo', x, y })),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    strokeStyle: '',
    fillStyle: '' as string | CanvasGradient,
  }
}
type CtxStub = ReturnType<typeof createCtxStub>

/**
 * The pile draws in batched paths of ISOLATED `moveTo → lineTo` pairs, one
 * per tuft. Polylines — the cloth clip, the rim, the restored arc — are runs
 * of `lineTo` and are excluded, so what this returns is the tufts (plus the
 * fallback panel's two horizontal creases). Angles fold into [0, π): a tuft
 * is a bidirectional stroke with no head or tail.
 */
function tuftAngles(ops: readonly DrawOp[]): number[] {
  const out: number[] = []
  for (let i = 0; i + 1 < ops.length; i += 1) {
    if (ops[i].op !== 'moveTo' || ops[i + 1].op !== 'lineTo') continue
    if (ops[i + 2]?.op === 'lineTo') continue
    const a = Math.atan2(ops[i + 1].y - ops[i].y, ops[i + 1].x - ops[i].x)
    out.push(((a % Math.PI) + Math.PI) % Math.PI)
  }
  return out
}

/** Share of tufts lying along the first pass's axis (down the piece). */
const combedShare = (angles: number[]) =>
  angles.filter((a) => Math.abs(a - Math.PI / 2) < 0.75).length / Math.max(1, angles.length)

/**
 * Tufts keyed by their MIDPOINT, which never moves — a tuft rotates and
 * breathes its length about a fixed seed. Batching reorders the op log every
 * frame (a tuft changing alpha bucket changes which path it lands in), so the
 * midpoint is the only stable identity across two frames.
 */
function tuftsByCenter(ops: readonly DrawOp[]): Map<string, number> {
  const out = new Map<string, number>()
  for (let i = 0; i + 1 < ops.length; i += 1) {
    if (ops[i].op !== 'moveTo' || ops[i + 1].op !== 'lineTo') continue
    if (ops[i + 2]?.op === 'lineTo') continue
    const [a, b] = [ops[i], ops[i + 1]]
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    out.set(
      `${((a.x + b.x) / 2).toFixed(2)},${((a.y + b.y) / 2).toFixed(2)}`,
      ((angle % Math.PI) + Math.PI) % Math.PI,
    )
  }
  return out
}

/** Synthetic RGBA raster: opaque alpha on the given row spans, 0 elsewhere. */
function alphaSpans(w: number, h: number, spans: Array<{ y: number; x0: number; x1: number }>) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (const s of spans) for (let x = s.x0; x <= s.x1; x += 1) data[(s.y * w + x) * 4 + 3] = 255
  return data
}

/** A NON-CONVEX garment stand-in: two arms over a joined hem, so every row in
 *  the upper half spans a gap the mask must reject. */
function uShapeSample(): SilhouetteSample2D {
  const spans: Array<{ y: number; x0: number; x1: number }> = []
  for (let y = 4; y <= 27; y += 1) {
    spans.push({ y, x0: 4, x1: 11 })
    spans.push({ y, x0: 28, x1: 35 })
  }
  for (let y = 28; y <= 35; y += 1) spans.push({ y, x0: 4, x1: 35 })
  const sample = buildSilhouetteSample2D(alphaSpans(40, 40, spans), 40, 40, 1, {
    outlinePoints: 96,
  })
  if (!sample) throw new Error('fixture is not a traceable silhouette')
  return sample
}

/**
 * Replace the setup-file matchMedia mock so reduced-motion can be toggled.
 */
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
 * microtask, so the null-fallback path resolves deterministically.
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

const BASE_PROPS: PassportEffectProps = { sectionKey: 'care', imageUrl: null, tier: 'console' }

describe('EffectCare', () => {
  let ctx: CtxStub

  beforeEach(() => {
    ctx = createCtxStub()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      // Documented cast: the stub covers the exact 2D API EffectCare calls;
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

  it('paints the whole pile and lets the hand comb it, then tears down completely', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { container, unmount } = render(<EffectCare {...BASE_PROPS} />)
    const canvas = container.querySelector('canvas')
    // No image → the designed folded-cloth panel, live, immediately.
    expect(canvas).toHaveAttribute('data-care-effect', 'cloth')
    expect(canvas).toHaveAttribute('data-motion', 'live')
    expect(rafSpy).toHaveBeenCalledTimes(1)

    // Drive the loop by hand (the rAF mock never fires callbacks).
    const frameCb = rafSpy.mock.calls[0]?.[0]
    expect(frameCb).toBeDefined()
    ctx.ops.length = 0
    frameCb?.(16)
    expect(rafSpy).toHaveBeenCalledTimes(2)
    expect(ctx.clip).toHaveBeenCalled() // light and pile only ever touch cloth

    // The PILE is on screen, not just a rim: one isolated segment per tuft.
    const before = tuftAngles(ctx.ops)
    expect(ctx.moveTo.mock.calls.length).toBeGreaterThanOrEqual(COUNTS.console.nap)
    expect(before.length).toBeGreaterThanOrEqual(COUNTS.console.nap)
    // …and it starts DISORDERED — a piece just come off the body.
    expect(combedShare(before)).toBeLessThan(0.68)

    // dt clamps at 64ms, so ~70 frames ≈ 4.5s of clock: the first keeping
    // pass (0.35s → +2.4s) has crossed the panel and every tuft it touched
    // has finished realigning (combS 0.6s). The next pass is ≥7.6s away.
    let tMs = 16
    for (let i = 0; i < 69; i += 1) {
      tMs += 64
      frameCb?.(tMs)
    }
    ctx.ops.length = 0
    tMs += 64
    frameCb?.(tMs)
    // The hand really combed the cloth: the pile now lies along the pass.
    expect(combedShare(tuftAngles(ctx.ops))).toBeGreaterThan(0.9)
    expect(ctx.createRadialGradient).toHaveBeenCalled() // the palm-sized pool
    expect(ctx.fillRect).toHaveBeenCalled()

    unmount()
    // Total teardown: rAF cancelled, every visibility hook removed.
    expect(cancelSpy).toHaveBeenCalledWith(7)
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    const visRemoves = removeSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBeGreaterThanOrEqual(1)
    expect(visRemoves).toBe(visAdds)
  })

  it('keeps every tuft moving between the hand’s passes', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    render(<EffectCare {...BASE_PROPS} />)
    const frameCb = rafSpy.mock.calls[0]?.[0]
    // Run out to ~4.5s: the pass has cleared and nothing else is scheduled
    // until ~7.6s, so anything that still moves is the pile's own idle.
    let tMs = 16
    frameCb?.(tMs)
    for (let i = 0; i < 69; i += 1) {
      tMs += 64
      frameCb?.(tMs)
    }
    ctx.ops.length = 0
    tMs += 64
    frameCb?.(tMs)
    const a = tuftsByCenter(ctx.ops)
    ctx.ops.length = 0
    tMs += 64
    frameCb?.(tMs)
    const b = tuftsByCenter(ctx.ops)

    // Same composition, one frame apart, with no pass anywhere near it…
    expect(a.size).toBeGreaterThanOrEqual(COUNTS.console.nap)
    expect(b.size).toBe(a.size)
    // …and the tufts have still turned. The idle lives in the GEOMETRY, so
    // the field is never a still between passes — which no assertion on
    // alpha, stroke counts or gradients could have caught.
    let moved = 0
    let total = 0
    for (const [key, angle] of a) {
      const next = b.get(key)
      if (next === undefined) continue
      total += 1
      if (Math.abs(angle - next) > 1e-4) moved += 1
    }
    expect(total).toBeGreaterThanOrEqual(COUNTS.console.nap)
    expect(moved / total).toBeGreaterThan(0.9)
  })

  it('waits dark while sampling, then falls back to the cloth panel when the decode fails', async () => {
    // Documented cast: the stand-in implements only the handler/src surface
    // the sampler's loader uses.
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const { container, unmount } = render(
      <EffectCare {...BASE_PROPS} imageUrl="https://cdn.test/care.png" />,
    )
    const canvas = container.querySelector('canvas')
    // Sampling in flight: the layer waits dark — no clock, no drawing yet.
    expect(canvas).toHaveAttribute('data-care-effect', 'pending')
    expect(rafSpy).not.toHaveBeenCalled()

    // Flush the failed decode → null sample → the designed fallback arms.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(canvas).toHaveAttribute('data-care-effect', 'cloth')
    expect(rafSpy).toHaveBeenCalledTimes(1)
    expect(() => unmount()).not.toThrow()
  })

  it('mounts and unmounts cleanly on the sheet tier, at exactly half the elements', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(9)
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const { container, unmount } = render(<EffectCare {...BASE_PROPS} tier="sheet" />)
    expect(container.querySelector('canvas')).toHaveAttribute('data-care-effect', 'cloth')
    ctx.ops.length = 0
    rafSpy.mock.calls[0]?.[0]?.(16)

    // The sheet tier's budget is half the console's, the pile it builds
    // follows that budget rather than the panel's area, and the frame it
    // paints carries that many tufts.
    expect(COUNTS.sheet.nap * 2).toBe(COUNTS.console.nap)
    expect(COUNTS.sheet.motes * 2).toBe(COUNTS.console.motes)
    expect(buildClothPanel(COUNTS.sheet.nap).seeds.length / 2).toBe(COUNTS.sheet.nap)
    const angles = tuftAngles(ctx.ops)
    expect(angles.length).toBeGreaterThanOrEqual(COUNTS.sheet.nap)
    expect(angles.length).toBeLessThan(COUNTS.console.nap)

    unmount()
    expect(cancelSpy).toHaveBeenCalledWith(9)
  })

  it('renders a still, authored composition under reduced motion — and no clock', () => {
    stubMatchMedia(true)
    // useReducedMotion flips to true in an effect, so a live loop may start
    // for one tick before the still branch takes over. The store-backed rAF
    // honours cancellation, so "no clock" is provable rather than assumed.
    installRafStore()

    const { container, unmount } = render(<EffectCare {...BASE_PROPS} tier="sheet" />)
    expect(container.querySelector('canvas')).toHaveAttribute('data-motion', 'still')
    // The still paints synchronously: the combed pile and the kept rim
    // (strokes) inside the cloth clip, the hand's light held mid-pass
    // (the pool's radial gradient), and three settled motes (arcs).
    expect(ctx.clip).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
    expect(ctx.createRadialGradient).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalledTimes(3)
    // …and it is a KEPT pile, not a paused disordered one.
    expect(combedShare(tuftAngles(ctx.ops))).toBeGreaterThan(0.9)

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

    const { unmount } = render(<EffectCare {...BASE_PROPS} />)
    expect(rafSpy).not.toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBe(0)
    expect(() => unmount()).not.toThrow()
  })
})

describe('toCareShape (registration to the real garment)', () => {
  it('stands every tuft on a set mask pixel, never in the gap between two arms', () => {
    const sample = uShapeSample()
    const shape = toCareShape(sample, 60)
    expect(shape).not.toBeNull()
    if (!shape) return
    expect(shape.mode).toBe('garment')
    expect(shape.seeds.length / 2).toBe(60)

    const W = sample.maskWidth
    const H = sample.maskHeight
    let inArms = 0
    for (let i = 0; i < shape.seeds.length; i += 2) {
      const mx = Math.min(W - 1, Math.floor(shape.seeds[i] * W))
      const my = Math.min(H - 1, Math.floor(shape.seeds[i + 1] * H))
      // THE assertion that a hoodie and a sock cannot look the same: the pile
      // is rejection-sampled against the mask, not against a bounding box.
      expect(sample.mask[my * W + mx]).toBe(1)
      if (my < 28) inArms += 1
    }
    // …and the non-convex half really is sampled, not merely survived.
    expect(inArms).toBeGreaterThan(0)
    // The outline is the piece's own contour, closed and normalized.
    expect(shape.outline.length / 2).toBe(sample.outline.length)
    expect(shape.creases.length).toBe(0) // a garment has its own folds
  })

  it('refuses a shape the pile cannot describe, so the folded panel takes over', () => {
    // Rows claim a full-width span, but the mask holds a single hairline: a
    // wire frame, not cloth. Proves the fallback ladder is reachable rather
    // than merely asserted in a comment.
    const W = 100
    const H = 100
    const mask = new Uint8Array(W * H)
    for (let y = 0; y < H; y += 1) mask[y * W + 2] = 1
    const wire: SilhouetteSample2D = {
      mask,
      maskWidth: W,
      maskHeight: H,
      aspect: 1,
      outline: [],
      rows: Array.from({ length: H }, () => ({ left: 0.02, right: 0.98 })),
      centroid: { x: 0.02, y: 0.5 },
    }
    expect(toCareShape(wire, 40)).toBeNull()
  })
})
