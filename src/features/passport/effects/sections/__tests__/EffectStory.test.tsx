import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import EffectStory from '../EffectStory'

/**
 * jsdom decodes no images, so the silhouette sampler always resolves null
 * here — every live test therefore exercises the DESIGNED fallback (the
 * bottom-rise glyph embers) and the reduced-motion fallback stills, which is
 * exactly the degradation path the contract requires. The 2D surface is
 * stubbed with the members the effect touches so the real paint code runs.
 */
function createCtxStub() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    font: '',
    fillStyle: '' as string | CanvasGradient,
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  }
}
type CtxStub = ReturnType<typeof createCtxStub>

/**
 * rAF handles live in a Map so cancelAnimationFrame genuinely removes them —
 * the effect relies on cancel-on-cleanup, and a stub that ignored cancellation
 * would leak stale live-loop frames into the reduced-motion assertions.
 */
let rafStore: Map<number, FrameRequestCallback>
let rafId = 0
let cancelRaf: ReturnType<typeof vi.fn>

function runOneFrame(at: number) {
  const pending = [...rafStore.values()]
  rafStore.clear()
  act(() => {
    for (const cb of pending) cb(at)
  })
}

/** Advance the effect's own clamped clock by `count` frames of `stepMs`. */
function runFrames(count: number, stepMs: number) {
  let at = performance.now()
  for (let i = 0; i < count; i += 1) {
    at += stepMs
    runOneFrame(at)
  }
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  )
}

/**
 * jsdom's Image never fires onload/onerror, which would leave the sampling
 * promise pending forever. This stand-in fails the decode on the next
 * microtask so the resolving → embers hand-off is observable and fast.
 */
class FailingImage {
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

describe('EffectStory', () => {
  let ctxStub: CtxStub

  beforeEach(() => {
    rafStore = new Map()
    rafId = 0
    cancelRaf = vi.fn((id: number) => {
      rafStore.delete(id)
    })
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafStore.set(++rafId, cb)
        return rafId
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', cancelRaf)
    stubReducedMotion(false)
    ctxStub = createCtxStub()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      // Stub carries only the 2D members the effect uses — see createCtxStub.
      ctxStub as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('runs the ember fallback live and unmounts cleanly for story (console)', () => {
    const { container, unmount } = render(
      <EffectStory sectionKey="story" imageUrl={null} tier="console" />,
    )
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas).toHaveAttribute('data-motion', 'live')
    // No image → no contour: the designed ember fallback, immediately.
    expect(canvas).toHaveAttribute('data-story-mode', 'embers')

    // Two frames: the ink vignette paints and the backdated glyph embers
    // (spawned mid-life by design) stamp Cinzel letterforms from frame one.
    const start = performance.now()
    runOneFrame(start + 16)
    runOneFrame(start + 32)
    expect(ctxStub.fillRect).toHaveBeenCalled()
    expect(ctxStub.fillText).toHaveBeenCalled()
    expect(ctxStub.font).toContain('Cinzel')

    unmount()
    expect(cancelRaf).toHaveBeenCalled()
    expect(rafStore.size).toBe(0)
  })

  it('waits dark while sampling, then degrades to embers when the decode fails (story)', async () => {
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { container, unmount } = render(
      <EffectStory sectionKey="story" imageUrl="https://cdn.test/story.png" tier="console" />,
    )
    const canvas = container.querySelector('canvas')
    // While the sample is in flight nothing runs — no clock, no paint.
    expect(canvas).toHaveAttribute('data-story-mode', 'resolving')
    expect(rafStore.size).toBe(0)

    // Flush the failed decode → null sample → the designed fallback arms.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(canvas).toHaveAttribute('data-story-mode', 'embers')
    runOneFrame(performance.now() + 16)
    expect(ctxStub.fillText).toHaveBeenCalled()

    unmount()
    // Total teardown: rAF cancelled, every visibility hook removed.
    expect(cancelRaf).toHaveBeenCalled()
    expect(rafStore.size).toBe(0)
    const visAdds = addSpy.mock.calls.filter(([t]) => t === 'visibilitychange').length
    const visRemoves = removeSpy.mock.calls.filter(([t]) => t === 'visibilitychange').length
    expect(visAdds).toBeGreaterThanOrEqual(1)
    expect(visRemoves).toBe(visAdds)
  })

  it('runs the sparser ember fallback on the sheet tier and unmounts cleanly', () => {
    const { container, unmount } = render(
      <EffectStory sectionKey="story" imageUrl={null} tier="sheet" />,
    )
    expect(container.querySelector('canvas')).toHaveAttribute('data-story-mode', 'embers')
    runFrames(3, 16)
    // The fallback is the glyph-ember field: letterforms, no written line.
    expect(ctxStub.fillText).toHaveBeenCalled()
    expect(ctxStub.stroke).not.toHaveBeenCalled()

    unmount()
    expect(cancelRaf).toHaveBeenCalled()
    // Unmount must leave nothing scheduled behind — the next frame is dead.
    expect(rafStore.size).toBe(0)
    expect(() => runOneFrame(performance.now() + 48)).not.toThrow()
  })

  it('renders the story still under reduced motion — three resting letterforms, no clock', () => {
    stubReducedMotion(true)
    const { container, unmount } = render(
      <EffectStory sectionKey="story" imageUrl={null} tier="console" />,
    )
    const canvas = container.querySelector('canvas')
    expect(canvas).toHaveAttribute('data-motion', 'still')

    // The still paints synchronously: vignette + exactly three cooled glyphs.
    expect(ctxStub.fillRect).toHaveBeenCalled()
    expect(ctxStub.fillText).toHaveBeenCalledTimes(3)
    expect(ctxStub.font).toContain('Cinzel')

    // Nothing left ticking: the transient pre-flip live frame was cancelled
    // when the reduced-motion flag settled, so draining the queue draws no more.
    const textCalls = ctxStub.fillText.mock.calls.length
    runOneFrame(performance.now() + 500)
    expect(ctxStub.fillText.mock.calls.length).toBe(textCalls)
    expect(() => unmount()).not.toThrow()
  })

  it('stays inert when the canvas has no 2D context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, unmount } = render(
      <EffectStory sectionKey="story" imageUrl={null} tier="console" />,
    )
    expect(container.querySelector('canvas')).not.toBeNull()
    expect(rafStore.size).toBe(0)
    expect(() => unmount()).not.toThrow()
  })
})
