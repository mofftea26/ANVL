import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'

/* Repo test rule: never run real animation libs in jsdom. `useReducedMotion`
   is swapped for a switch. The silhouette sampler is swapped for a hoisted
   result switch (jsdom decodes no images), while the module's PURE geometry
   builder stays real — so the garment path in these tests runs on a genuine
   `buildSilhouetteSample2D` sample from synthetic pixels. */
const motionState = vi.hoisted(() => ({ reduced: false }))
const sampleState = vi.hoisted(() => ({
  result: null as import('../../lib/silhouette2d').SilhouetteSample2D | null,
}))

vi.mock('@/shared/hooks/useReducedMotion', () => ({
  useReducedMotion: () => motionState.reduced,
}))

vi.mock('../../lib/silhouette2d', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/silhouette2d')>()
  return {
    ...actual,
    sampleSilhouette2D: vi.fn(async () => sampleState.result),
  }
})

import { buildSilhouetteSample2D } from '../../lib/silhouette2d'
import EffectDetails from '../EffectDetails'

/** A real sample from synthetic pixels: a 20×30 opaque blob on a 40×50 raster
 *  — passes every sparse-silhouette gate in the shared sampler. */
function syntheticSample() {
  const w = 40
  const h = 50
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 10; y < 40; y += 1) {
    for (let x = 10; x < 30; x += 1) data[(y * w + x) * 4 + 3] = 255
  }
  const sample = buildSilhouetteSample2D(data, w, h, 0.8)
  if (!sample) throw new Error('synthetic sample unexpectedly failed the gates')
  return sample
}

/** Minimal 2D-context stub — only the members the cooling engine touches.
    Kept as a typed object so tests read the mocks without casting back out
    of the DOM type; composite-op writes are recorded for assertions. */
function raw2dContext() {
  const gradient = { addColorStop: vi.fn() }
  const ops: string[] = []
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    createLinearGradient: vi.fn(() => gradient),
    fillStyle: '' as CanvasGradient | string,
    globalAlpha: 1,
    ops,
    set globalCompositeOperation(v: string) {
      ops.push(v)
    },
    get globalCompositeOperation() {
      return ops[ops.length - 1] ?? 'source-over'
    },
  }
}

/** Controllable requestAnimationFrame: `tick(ms)` advances the clock and
 * invokes the most recently scheduled frame, mirroring one real rAF tick. */
function installFrameControls() {
  let now = 0
  let pending: FrameRequestCallback | null = null
  let nextId = 1

  // A vi.fn so stills can assert the clock NEVER started, not just idled.
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback): number => {
      const id = nextId
      nextId += 1
      pending = cb
      return id
    }),
  )
  vi.stubGlobal('cancelAnimationFrame', (_id: number) => {
    pending = null
  })
  vi.spyOn(performance, 'now').mockImplementation(() => now)

  return {
    tick(ms: number) {
      now += ms
      const cb = pending
      pending = null
      cb?.(now)
    },
    hasPending: () => pending !== null,
  }
}

const RECT: DOMRect = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: 320,
  bottom: 416,
  width: 320,
  height: 416,
  toJSON: () => ({}),
}

const flushSample = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

function renderDetails(imageUrl: string | null, tier: 'console' | 'sheet' = 'console') {
  return render(<EffectDetails sectionKey="details" imageUrl={imageUrl} tier={tier} />)
}

describe('EffectDetails', () => {
  let raw: ReturnType<typeof raw2dContext>

  beforeEach(() => {
    motionState.reduced = false
    sampleState.result = null
    raw = raw2dContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      // Justification: a hand-rolled stub only needs the subset of the 2D
      // context API EffectDetails actually calls.
      raw as unknown as CanvasRenderingContext2D,
    )
    // The effect measures its host box; jsdom rects are all-zero by default.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(RECT)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('falls back to the hearth when the image cannot be sampled, draws, and unmounts cleanly', async () => {
    const frames = installFrameControls()
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { container, unmount } = renderDetails('https://cdn.test/details.png')

    await flushSample() // sampler resolves null → the designed hearth fallback
    const root = container.querySelector('[data-passport-effect="details"]')
    expect(root).toBeInTheDocument()
    expect(root).toHaveAttribute('data-details-shape', 'hearth')
    expect(frames.hasPending()).toBe(true)

    // Births are backdated at mount, so the very first frames already draw
    // live embers (arc) and the coal pool (fillRect) additively.
    frames.tick(0)
    frames.tick(16)
    expect(raw.arc).toHaveBeenCalled()
    expect(raw.fillRect).toHaveBeenCalled()
    expect(raw.ops).toContain('lighter')

    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBeGreaterThanOrEqual(1)
    expect(() => unmount()).not.toThrow()
    expect(frames.hasPending()).toBe(false) // rAF cancelled — nothing leaks
    const visRemoves = removeSpy.mock.calls.filter(
      ([type]) => type === 'visibilitychange',
    ).length
    expect(visRemoves).toBe(visAdds)
  })

  it('registers to the real garment: clips the internal heat to the sampled silhouette and sheds contour embers', async () => {
    sampleState.result = syntheticSample()
    const frames = installFrameControls()
    const { container, unmount } = renderDetails('https://cdn.test/details.png')

    await flushSample()
    expect(
      container.querySelector('[data-passport-effect="details"]'),
    ).toHaveAttribute('data-details-shape', 'garment')
    expect(frames.hasPending()).toBe(true)

    // Walk into the quench window (starts 0.35s in; dt clamps at 64ms/frame):
    // the silhouette path is traced + clipped every frame, embers arc along
    // the real outline, and the steam flashes land on real edge intercepts.
    frames.tick(0)
    for (let i = 0; i < 10; i += 1) frames.tick(64) // clock ≈ 0.64s — mid-quench
    expect(raw.clip).toHaveBeenCalled()
    expect(raw.lineTo).toHaveBeenCalled() // the traced outline, not a box
    expect(raw.arc).toHaveBeenCalled()
    expect(raw.fillRect).toHaveBeenCalled() // heat patches + quench band
    expect(raw.ops).toContain('lighter')

    expect(() => unmount()).not.toThrow()
    expect(frames.hasPending()).toBe(false)
  })

  it('parks the loop while the document is hidden and resumes on return', () => {
    const frames = installFrameControls()
    let hidden = false
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })

    const { unmount } = renderDetails(null) // no image → hearth, synchronously
    expect(frames.hasPending()).toBe(true)

    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    expect(frames.hasPending()).toBe(false)

    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    expect(frames.hasPending()).toBe(true)

    unmount()
    // Restore the prototype getter so other tests see the real document.
    delete (document as { hidden?: boolean }).hidden
  })

  it('reduced motion renders the still: heat held, resting embers drawn once, no clock', () => {
    motionState.reduced = true
    const frames = installFrameControls()
    const { container, unmount } = renderDetails(null)

    const root = container.querySelector('[data-passport-effect="details"]')
    expect(root).toHaveAttribute('data-pp-details', 'cooling-still')
    // Drawn synchronously, exactly once — a still composition, not a slowed
    // animation: the clock never starts.
    expect(raw.fillRect).toHaveBeenCalled() // the held glow
    expect(raw.arc).toHaveBeenCalled() // the resting embers
    expect(frames.hasPending()).toBe(false)
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    expect(() => unmount()).not.toThrow()
  })

  it('degrades to nothing, cleanly, when no 2D context is available', () => {
    const frames = installFrameControls()
    const addSpy = vi.spyOn(document, 'addEventListener')
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const { container, unmount } = renderDetails(null)
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(frames.hasPending()).toBe(false)
    expect(raw.arc).not.toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBe(0)
    expect(() => unmount()).not.toThrow()
  })

  it('sheet tier mounts the same composition (lighter pools, same seam)', () => {
    const frames = installFrameControls()
    const { container } = renderDetails(null, 'sheet')
    expect(container.querySelector('[data-passport-effect="details"]')).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(frames.hasPending()).toBe(true)
  })
})
