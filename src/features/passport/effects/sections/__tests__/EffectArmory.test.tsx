import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

// GSAP is ambience here — mock it away (house pattern, see passportConsole
// tests) so the suite asserts the layer's structure and lifecycle, not tweens.
vi.mock('@/shared/lib/gsap', () => {
  const chain: Record<string, unknown> = {}
  chain.to = () => chain
  chain.from = () => chain
  chain.fromTo = () => chain
  chain.kill = () => undefined
  return {
    gsap: {
      timeline: () => chain,
      to: () => chain,
      from: () => chain,
      set: () => undefined,
      killTweensOf: () => undefined,
    },
  }
})
vi.mock('@gsap/react', () => ({ useGSAP: () => undefined }))

// Controllable reduced-motion switch — the component renders its STILL
// composition when this is true, so both variants are testable directly.
const motionState = vi.hoisted(() => ({ reduced: false }))
vi.mock('@/shared/hooks/useReducedMotion', () => ({
  useReducedMotion: () => motionState.reduced,
}))

import EffectArmory from '../EffectArmory'

// jsdom has no 2D canvas — the stand-in covers the setup path only (the rAF
// loop never runs: requestAnimationFrame is mocked to a counter below).
const fakeCtx = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
}
const originalGetContext = HTMLCanvasElement.prototype.getContext

describe('EffectArmory', () => {
  let rafSeq = 0

  beforeEach(() => {
    motionState.reduced = false
    rafSeq = 0
    // Documented cast: jsdom's getContext throws "not implemented"; the fake
    // only needs the members the hall's setup path touches.
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => fakeCtx,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext
    // rAF callbacks must never actually run — keeps the suite deterministic.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => ++rafSeq)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
    vi.restoreAllMocks()
  })

  it('mounts the full hall (console), tolerates jsdom 0×0 rects via fallback geometry, and tears down balanced', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { container, unmount } = render(
      <EffectArmory sectionKey="armory" imageUrl={null} tier="console" />,
    )
    const root = container.querySelector<HTMLElement>('[data-armory-effect="console"]')
    expect(root).toBeInTheDocument()
    // jsdom rects are all 0×0 — the measure path must degrade deliberately,
    // register to the wrapper's own bounds, and still mount every voice.
    expect(root).toHaveAttribute('data-armory-geometry', 'fallback')
    // The heart's x falls back to the panel's own center when nothing measures.
    expect(root?.style.getPropertyValue('--armory-heart-x')).toBe('50.00%')
    // All voices present: canvas, held perimeter, heartbeat.
    expect(container.querySelector('[data-armory-canvas]')).toBeInTheDocument()
    expect(container.querySelector('[data-armory-perimeter]')).toBeInTheDocument()
    expect(container.querySelector('[data-armory-heartbeat]')).toBeInTheDocument()
    // Regression guard: the heraldic corner standards were removed — the
    // perimeter rite now simply completes the border and nothing else.
    expect(container.querySelector('[data-armory-standard]')).not.toBeInTheDocument()
    // The draw loop armed (fake ctx available, tab visible).
    expect(window.requestAnimationFrame).toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBeGreaterThanOrEqual(1)

    unmount()

    // Balanced teardown: rAF cancelled, every visibility hook removed.
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    const visRemoves = removeSpy.mock.calls.filter(
      ([type]) => type === 'visibilitychange',
    ).length
    expect(visRemoves).toBe(visAdds)
  })

  it('attaches the scroll listener to the sibling scroll container and removes it on unmount', () => {
    // Recreate the real mounting reality: wrapper > effect layer (our render
    // container) + the sibling scroller holding the panel's <section>s.
    const wrapper = document.createElement('div')
    const layer = document.createElement('div')
    layer.setAttribute('data-pp-effect', 'armory')
    const scroller = document.createElement('div')
    const inner = document.createElement('div')
    for (let i = 0; i < 3; i += 1) inner.appendChild(document.createElement('section'))
    scroller.appendChild(inner)
    wrapper.append(layer, scroller)
    document.body.appendChild(wrapper)
    const addSpy = vi.spyOn(scroller, 'addEventListener')
    const removeSpy = vi.spyOn(scroller, 'removeEventListener')
    try {
      const { container, unmount } = render(
        <EffectArmory sectionKey="armory" imageUrl={null} tier="console" />,
        { container: layer },
      )
      const scrollAdds = addSpy.mock.calls.filter(([type]) => type === 'scroll')
      expect(scrollAdds).toHaveLength(1)
      expect(scrollAdds[0]?.[2]).toMatchObject({ passive: true })
      // The sections exist but jsdom reports them 0×0 — fallback, not a crash.
      expect(container.querySelector('[data-armory-effect="console"]')).toHaveAttribute(
        'data-armory-geometry',
        'fallback',
      )

      unmount()

      const scrollRemoves = removeSpy.mock.calls.filter(([type]) => type === 'scroll').length
      expect(scrollRemoves).toBe(scrollAdds.length)
    } finally {
      wrapper.remove()
    }
  })

  it('mounts the sheet tier with the lighter budget and unmounts cleanly', () => {
    const { container, unmount } = render(
      <EffectArmory sectionKey="armory" imageUrl={null} tier="sheet" />,
    )
    expect(container.querySelector('[data-armory-effect="sheet"]')).toBeInTheDocument()
    expect(container.querySelector('[data-armory-canvas]')).toBeInTheDocument()
    expect(() => unmount()).not.toThrow()
  })

  it('reduced motion renders the STILL: warmth static, perimeter held complete', () => {
    motionState.reduced = true
    try {
      const { container, unmount } = render(
        <EffectArmory sectionKey="armory" imageUrl={null} tier="console" />,
      )
      // Nothing moves: no canvas, no clock.
      expect(container.querySelector('[data-armory-canvas]')).not.toBeInTheDocument()
      expect(window.requestAnimationFrame).not.toHaveBeenCalled()
      // The still composition: held perimeter + warmth.
      expect(container.querySelector('[data-armory-perimeter]')).toBeInTheDocument()
      expect(container.querySelector('[data-armory-heartbeat]')).toBeInTheDocument()
      // Geometry still measured once (the heart's center, the fallback flag).
      expect(container.querySelector('[data-armory-effect="console"]')).toHaveAttribute(
        'data-armory-geometry',
        'fallback',
      )
      expect(() => unmount()).not.toThrow()
    } finally {
      motionState.reduced = false
    }
  })

  it('degrades to the DOM-only hall, inert and clean, when no 2D context exists', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    // Documented cast: exotic-browser path — getContext yields null.
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => null,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext
    const { container, unmount } = render(
      <EffectArmory sectionKey="armory" imageUrl={null} tier="console" />,
    )
    // Canvas voices stand down; the DOM voices stand alone.
    expect(container.querySelector('[data-armory-canvas]')).toBeInTheDocument()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    const visAdds = addSpy.mock.calls.filter(([type]) => type === 'visibilitychange').length
    expect(visAdds).toBe(0)
    expect(container.querySelector('[data-armory-perimeter]')).toBeInTheDocument()
    expect(container.querySelector('[data-armory-heartbeat]')).toBeInTheDocument()
    expect(() => unmount()).not.toThrow()
  })
})
