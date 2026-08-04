import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'

import EffectPiece from '../EffectPiece'

/** jsdom lacks matchMedia semantics — drive useReducedMotion deterministically. */
function stubMatchMedia(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
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

// jsdom has no 2D canvas — a minimal stand-in covers every member the outline
// engine touches (setup + the still's synchronous draw; the rAF loop itself
// never runs because requestAnimationFrame is mocked below).
const fakeGradient = { addColorStop: vi.fn() }
const fakeCtx = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  fillRect: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  createRadialGradient: vi.fn(() => fakeGradient),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
}
const originalGetContext = HTMLCanvasElement.prototype.getContext

/**
 * jsdom never decodes images (onload/onerror both stay silent forever), which
 * would leave the silhouette-sampling promise pending. This stand-in fails the
 * decode on the next microtask, short-circuiting the sampling path so the
 * graceful ring-flow fallback is what the suite exercises — by design.
 */
class FailingImage {
  crossOrigin = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

describe('EffectPiece', () => {
  let rafSeq = 0

  beforeEach(() => {
    rafSeq = 0
    // Documented cast: jsdom's getContext throws "not implemented"; the fake
    // only needs the members the outline engine touches.
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => fakeCtx,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext
    // rAF callbacks must never actually run — keeps the suite deterministic.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => ++rafSeq)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('falls back to the ring flow when the image cannot be sampled, and tears down completely', async () => {
    stubMatchMedia(false)
    // Documented cast: the stand-in only implements the handler/src surface
    // the tracer's loader uses.
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { container, unmount } = render(
      <EffectPiece sectionKey="piece" imageUrl="https://cdn.test/piece.png" tier="console" />,
    )
    // Flush the failed decode → fallback loop → flow engine arms.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.querySelector('[data-pp-piece="outline"]')).toBeTruthy()
    expect(container.querySelector('canvas')).toBeTruthy()
    expect(window.requestAnimationFrame).toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBeGreaterThanOrEqual(1)

    unmount()

    // Total teardown: rAF cancelled, every visibility hook removed.
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    const visRemoves = removeSpy.mock.calls.filter(
      ([type]) => type === 'visibilitychange',
    ).length
    expect(visRemoves).toBe(visAdds)
  })

  it('runs the elliptical ring flow immediately when there is no image (sheet tier)', () => {
    stubMatchMedia(false)
    const { container, unmount } = render(
      <EffectPiece sectionKey="piece" imageUrl={null} tier="sheet" />,
    )
    expect(container.querySelector('[data-pp-piece="outline"]')).toBeTruthy()
    expect(container.querySelector('canvas')).toBeTruthy()
    // No decode to wait for — the fallback loop arms the flow synchronously.
    expect(window.requestAnimationFrame).toHaveBeenCalled()
    expect(() => unmount()).not.toThrow()
  })

  it('reduced motion holds the outline as a still — drawn once, no clock', () => {
    stubMatchMedia(true)
    const { container, unmount } = render(
      <EffectPiece sectionKey="piece" imageUrl={null} tier="console" />,
    )
    expect(container.querySelector('[data-pp-piece="outline-still"]')).toBeTruthy()
    expect(container.querySelector('[data-pp-piece="outline"]')).toBeNull()
    expect(container.querySelector('canvas')).toBeTruthy()
    // A still composition, not a slowed animation: the clock never starts.
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    expect(() => unmount()).not.toThrow()
  })

  it('degrades to nothing, cleanly, when no 2D context is available', () => {
    stubMatchMedia(false)
    const addSpy = vi.spyOn(document, 'addEventListener')
    // Documented cast: exotic-browser path — getContext yields null.
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => null,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const { container, unmount } = render(
      <EffectPiece sectionKey="piece" imageUrl={null} tier="console" />,
    )
    expect(container.querySelector('canvas')).toBeTruthy()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBe(0)
    expect(() => unmount()).not.toThrow()
  })
})
