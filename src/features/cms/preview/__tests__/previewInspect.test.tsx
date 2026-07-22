/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveInspectTarget, startPreviewInspect } from '../previewInspect'

const RING_CLASS = 'anvl-preview-ring'
const OVERLAY_SELECTOR = '.anvl-preview-overlay'

function mountFixture() {
  document.body.innerHTML = `
    <div id="hero" data-anvl-preview-target="shop:hero"><button id="inner">cta</button></div>
    <section id="scene" data-scene="manifesto"><p id="scene-child">creed</p></section>
    <a id="plain" href="/somewhere">plain link</a>
  `
}

function fire(el: Element, type: string) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event
}

let stop: (() => void) | null = null

afterEach(() => {
  stop?.()
  stop = null
  document.body.innerHTML = ''
})

describe('resolveInspectTarget', () => {
  it('resolves the nearest [data-anvl-preview-target] ancestor', () => {
    mountFixture()
    expect(resolveInspectTarget(document.getElementById('inner'))).toEqual({
      kind: 'content-field',
      id: 'shop:hero',
    })
  })

  it('maps the Oath data-scene fallback back to the-oath ids', () => {
    mountFixture()
    expect(resolveInspectTarget(document.getElementById('scene-child'))).toEqual({
      kind: 'content-field',
      id: 'the-oath:manifesto',
    })
  })

  it('returns null for unmapped nodes and non-elements', () => {
    mountFixture()
    expect(resolveInspectTarget(document.getElementById('plain'))).toBeNull()
    expect(resolveInspectTarget(null)).toBeNull()
  })
})

describe('startPreviewInspect', () => {
  it('highlights the hovered mapped element locally and reports it once', () => {
    mountFixture()
    const onHover = vi.fn()
    stop = startPreviewInspect({ onHover, onClick: vi.fn(), onExit: vi.fn() })

    const inner = document.getElementById('inner')!
    fire(inner, 'pointerover')
    fire(inner, 'pointerover') // same target — deduped

    expect(onHover).toHaveBeenCalledTimes(1)
    expect(onHover).toHaveBeenCalledWith({ kind: 'content-field', id: 'shop:hero' })
    expect(document.getElementById('hero')!.classList.contains(RING_CLASS)).toBe(true)
    // Outline + translucent overlay covering the element's bounds.
    expect(document.querySelector(OVERLAY_SELECTOR)).not.toBeNull()

    // Moving onto an unmapped node clears the highlight and reports null.
    fire(document.getElementById('plain')!, 'pointerover')
    expect(onHover).toHaveBeenLastCalledWith(null)
    expect(document.getElementById('hero')!.classList.contains(RING_CLASS)).toBe(false)
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull()
  })

  it('suppresses every click and reports only mapped targets', () => {
    mountFixture()
    const onClick = vi.fn()
    stop = startPreviewInspect({ onHover: vi.fn(), onClick, onExit: vi.fn() })

    const mappedClick = fire(document.getElementById('inner')!, 'click')
    expect(mappedClick.defaultPrevented).toBe(true)
    expect(onClick).toHaveBeenCalledWith({ kind: 'content-field', id: 'shop:hero' })

    // Unmapped click: still suppressed (no storefront navigation), no report.
    const plainClick = fire(document.getElementById('plain')!, 'click')
    expect(plainClick.defaultPrevented).toBe(true)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('exits on Escape and cleans up fully on teardown', () => {
    mountFixture()
    const onHover = vi.fn()
    const onExit = vi.fn()
    stop = startPreviewInspect({ onHover, onClick: vi.fn(), onExit })

    fire(document.getElementById('inner')!, 'pointerover')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onHover).toHaveBeenLastCalledWith(null)

    stop()
    stop = null
    // Listeners are gone: further events change nothing.
    onHover.mockClear()
    fire(document.getElementById('inner')!, 'pointerover')
    const click = fire(document.getElementById('inner')!, 'click')
    expect(onHover).not.toHaveBeenCalled()
    expect(click.defaultPrevented).toBe(false)
    expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull()
  })
})
