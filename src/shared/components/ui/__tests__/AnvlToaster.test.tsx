/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
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
  // Clear sonner's module-level toast state so plates never leak across tests.
  act(() => {
    toast.dismiss()
  })
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

  it('renders no canvas under prefers-reduced-motion (static plate path)', () => {
    mockReducedMotion(true)
    render(<AnvlToaster />)

    // sonner still mounts (its entrance + the CSS ignition flare both respect
    // the preference; the plate itself is styled statically)...
    expect(document.querySelector('section[aria-live="polite"]')).not.toBeNull()
    // ...but the ember forge layer drops itself entirely.
    expect(document.querySelector('canvas')).toBeNull()
  })

  it('does not throw when the toaster mounts (no getContext in jsdom)', () => {
    mockReducedMotion(false)
    expect(() => render(<AnvlToaster />)).not.toThrow()
  })

  it('forges billet plates with type-driven accents via data-type', async () => {
    mockReducedMotion(false)
    render(<AnvlToaster />)

    act(() => {
      toast.success('Oath sealed', {
        description: 'The plate is quenched.',
        action: { label: 'Undo', onClick: () => {} },
      })
      toast.error('Strike failed')
      toast('Plain steel')
    })

    // Each type stamps its own plate: the CSS heat system (seam, bleed, stamp
    // eyebrow, maker's mark, underlight) keys entirely off data-type.
    await waitFor(() => {
      expect(document.querySelector('[data-sonner-toast][data-type="success"]')).not.toBeNull()
      expect(document.querySelector('[data-sonner-toast][data-type="error"]')).not.toBeNull()
      // Plain toasts carry no data-type — they fall to the base ember plate.
      expect(document.querySelector('[data-sonner-toast]:not([data-type])')).not.toBeNull()
    })

    const success = document.querySelector('[data-sonner-toast][data-type="success"]')
    if (!success) throw new Error('success plate missing')

    // The plate carries the classNames contract the stylesheet targets.
    expect(success.classList.contains('anvl-toast')).toBe(true)
    expect(success.querySelector('.anvl-toast-content')).not.toBeNull()
    expect(success.querySelector('.anvl-toast-title')?.textContent).toBe('Oath sealed')
    expect(success.querySelector('.anvl-toast-description')?.textContent).toBe(
      'The plate is quenched.',
    )
    // Maker's mark (per-type icon) + forged action chip + 44px dismiss target.
    expect(success.querySelector('.anvl-toast-icon[data-icon]')).not.toBeNull()
    expect(success.querySelector('button.anvl-toast-action')?.textContent).toBe('Undo')
    expect(success.querySelector('button.anvl-toast-close[data-close-button]')).not.toBeNull()

    // Plain string toasts still render their message through the same plate.
    const plain = document.querySelector('[data-sonner-toast]:not([data-type])')
    expect(plain?.classList.contains('anvl-toast')).toBe(true)
    expect(plain?.textContent).toContain('Plain steel')
  })

  it('keeps the forge layer mounted alongside live plates', async () => {
    mockReducedMotion(false)
    render(<AnvlToaster />)

    act(() => {
      toast.info('Heat notice')
    })

    await waitFor(() => {
      expect(document.querySelector('[data-sonner-toast][data-type="info"]')).not.toBeNull()
    })
    // The ember canvas coexists with the plates (it crowns each arrival).
    expect(document.querySelector('canvas')).not.toBeNull()
  })
})
