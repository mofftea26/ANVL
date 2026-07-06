import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHighlightOnArrival } from '@/shared/hooks/useHighlightOnArrival'

function setHash(hash: string) {
  window.history.pushState(null, '', hash ? `#${hash}` : window.location.pathname)
}

describe('useHighlightOnArrival', () => {
  it('does nothing when the hash does not match', () => {
    setHash('other-section')
    const el = document.createElement('div')
    el.id = 'about-orb-materials'
    document.body.appendChild(el)

    renderHook(() => useHighlightOnArrival('about-orb-materials'))

    expect(el.classList.contains('anvl-highlight-pulse')).toBe(false)
    el.remove()
  })

  it('scrolls into view and applies the pulse class when the hash matches', () => {
    setHash('about-orb-materials')
    const el = document.createElement('div')
    el.id = 'about-orb-materials'
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    renderHook(() => useHighlightOnArrival('about-orb-materials'))

    expect(el.scrollIntoView).toHaveBeenCalled()
    expect(el.classList.contains('anvl-highlight-pulse')).toBe(true)
    el.remove()
  })

  it('removes the pulse class after the timeout', () => {
    vi.useFakeTimers()
    setHash('about-orb-materials')
    const el = document.createElement('div')
    el.id = 'about-orb-materials'
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    renderHook(() => useHighlightOnArrival('about-orb-materials'))
    expect(el.classList.contains('anvl-highlight-pulse')).toBe(true)

    vi.advanceTimersByTime(2000)
    expect(el.classList.contains('anvl-highlight-pulse')).toBe(false)

    el.remove()
    vi.useRealTimers()
  })

  it('is a no-op for an empty elementId', () => {
    setHash('')
    renderHook(() => useHighlightOnArrival(''))
    // Just asserting it doesn't throw with no matching element in the DOM.
  })
})
