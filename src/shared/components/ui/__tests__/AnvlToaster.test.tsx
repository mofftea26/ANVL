/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AnvlToaster } from '@/shared/components/ui/AnvlToaster'

/** Point window.matchMedia at a fixed reduced-motion answer for one test. */
function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(false),
  }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AnvlToaster', () => {
  it('mounts the sonner engine + the forge canvas layer', () => {
    mockReducedMotion(false)
    render(<AnvlToaster />)

    // sonner always renders its polite live region (the `[data-sonner-toaster]`
    // list itself only appears once a toast exists)...
    expect(document.querySelector('section[aria-live="polite"]')).not.toBeNull()
    // ...and the ember forge layer sits alongside it (jsdom has no 2D context,
    // so the effect no-ops, but the canvas element is still mounted).
    expect(document.querySelector('canvas')).not.toBeNull()
  })

  it('renders no canvas under prefers-reduced-motion', () => {
    mockReducedMotion(true)
    render(<AnvlToaster />)

    // sonner still mounts (its own entrance respects the preference)...
    expect(document.querySelector('section[aria-live="polite"]')).not.toBeNull()
    // ...but the ember forge layer drops itself entirely.
    expect(document.querySelector('canvas')).toBeNull()
  })

  it('does not throw when the toaster mounts (no getContext in jsdom)', () => {
    mockReducedMotion(false)
    expect(() => render(<AnvlToaster />)).not.toThrow()
  })
})
