import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EffectMaterial from '../EffectMaterial'

/**
 * jsdom ships no canvas implementation, so a minimal 2D-context stand-in lets
 * the effect exercise its real draw path (thread strokes, ripple slices, the
 * sheen gradient, fiber filaments).
 */
function createFakeCtx() {
  const gradient = { addColorStop: vi.fn() }
  return {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    strokeStyle: '',
    fillStyle: '' as string | typeof gradient,
    lineWidth: 1,
    lineCap: 'round',
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
  }
}

type GetContext = HTMLCanvasElement['getContext']
const originalGetContext = HTMLCanvasElement.prototype.getContext

let fakeCtx: ReturnType<typeof createFakeCtx>
let rafCallbacks: FrameRequestCallback[]

/** Reduced-motion override — the setup.ts default answers `matches: false`. */
function mockReducedMotion() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(false),
    })),
  )
}

/**
 * jsdom never decodes images (onload/onerror both stay silent forever), which
 * would leave the silhouette-sampling promise pending. This stand-in fails the
 * decode on the next microtask, short-circuiting the sampling path so the
 * designed fallback — the miniature woven loom — is what the suite exercises.
 */
class FailingImage {
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

beforeEach(() => {
  fakeCtx = createFakeCtx()
  rafCallbacks = []
  // Manual rAF queue: frames only run when the test drives them, so timing is
  // deterministic and unmount-cancellation is observable.
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => rafCallbacks.push(cb)))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  // Cast documented: the stand-in covers exactly the 2D surface the effect uses.
  HTMLCanvasElement.prototype.getContext = ((id: string) =>
    id === '2d' ? (fakeCtx as unknown as CanvasRenderingContext2D) : null) as GetContext
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 416, height: 520, top: 0, left: 0, right: 416, bottom: 520, x: 0, y: 0,
    toJSON: () => ({}),
  })
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('EffectMaterial', () => {
  it('falls back to the woven loom when the image cannot be sampled, laces it in, and tears down completely', async () => {
    // Documented cast: the stand-in only implements the handler/src surface
    // the sampler's loader uses.
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { container, unmount } = render(
      <EffectMaterial sectionKey="material" imageUrl="https://cdn.test/piece.png" tier="console" />,
    )
    // While the (doomed) decode is in flight the stage waits, dark.
    expect(container.querySelector('canvas')).toHaveAttribute('data-pp-material', 'pending')

    // Flush the failed decode → null sample → the designed loom fallback.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(container.querySelector('canvas')).toHaveAttribute('data-pp-material', 'loom')
    expect(requestAnimationFrame).toHaveBeenCalled()

    // Drive frames by hand (dt is clamped to 50ms, so ~14 frames ≈ 0.65s of
    // clock) — deep inside the lace-in window, threads actively drawing on.
    act(() => {
      for (let i = 0; i < 14; i += 1) rafCallbacks[i]?.(i * 100)
    })
    expect(fakeCtx.stroke).toHaveBeenCalled()

    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBeGreaterThanOrEqual(1)

    unmount()

    // Total teardown: rAF cancelled, every visibility hook removed.
    expect(cancelAnimationFrame).toHaveBeenCalled()
    const visRemoves = removeSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visRemoves).toBe(visAdds)
    expect(container.querySelector('canvas')).toBeNull()
  })

  it('mounts the loom immediately with no image at all (sheet tier)', () => {
    const { container, unmount } = render(
      <EffectMaterial sectionKey="material" imageUrl={null} tier="sheet" />,
    )
    expect(container.querySelector('canvas')).toHaveAttribute('data-pp-material', 'loom')
    // No decode to wait for — the living lattice arms synchronously.
    expect(requestAnimationFrame).toHaveBeenCalled()
    expect(() => unmount()).not.toThrow()
  })

  it('reduced motion holds the completed lattice as a still — drawn once, no clock', () => {
    mockReducedMotion()
    const { container, unmount } = render(
      <EffectMaterial sectionKey="material" imageUrl={null} tier="console" />,
    )
    expect(container.querySelector('canvas')).toHaveAttribute('data-pp-material', 'still')
    // A still composition, not a slowed animation: the clock never starts...
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    // ...but the FULL lattice is painted (console loom = 5 ring strands + 26
    // cross ticks = 31 strokes), proving the still is the finished cloth.
    expect(fakeCtx.stroke.mock.calls.length).toBeGreaterThanOrEqual(31)
    unmount()
    expect(container.querySelector('canvas')).toBeNull()
  })

  it('degrades to nothing, cleanly, when no 2D context is available', () => {
    HTMLCanvasElement.prototype.getContext = (() => null) as GetContext
    const addSpy = vi.spyOn(document, 'addEventListener')
    const { container, unmount } = render(
      <EffectMaterial sectionKey="material" imageUrl={null} tier="console" />,
    )
    expect(container.querySelector('canvas')).not.toBeNull()
    expect(fakeCtx.stroke).not.toHaveBeenCalled()
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBe(0)
    expect(() => unmount()).not.toThrow()
  })
})
