import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'

/* Repo test rule: never run real animation libs in jsdom. `useReducedMotion`
   is swapped for a switch, and GSAP for a chainable no-op — but the useGSAP
   mock still invokes the callback (honoring the component's `dependencies`,
   so a late layout re-runs it — real hook timing) and runs its returned
   cleanup, so the timeline-building path executes against the real rendered
   DOM and would throw on drift. */
const motionState = vi.hoisted(() => ({ reduced: false }))

vi.mock('@/shared/hooks/useReducedMotion', () => ({
  useReducedMotion: () => motionState.reduced,
}))

vi.mock('@/shared/lib/gsap', () => {
  interface Chain {
    to: (...args: unknown[]) => Chain
    fromTo: (...args: unknown[]) => Chain
    set: (...args: unknown[]) => Chain
    add: (...args: unknown[]) => Chain
    kill: () => void
  }
  const chain: Chain = {
    to: () => chain,
    fromTo: () => chain,
    set: () => chain,
    add: () => chain,
    kill: () => undefined,
  }
  return { gsap: { timeline: () => chain, to: () => chain, fromTo: () => chain, set: () => chain } }
})

vi.mock('@gsap/react', async () => {
  const { useEffect } = await import('react')
  return {
    useGSAP: (cb: () => void | (() => void), config?: { dependencies?: unknown[] }) => {
      // Mock-only dynamic deps (stable length in the component under test):
      // mirrors the real hook's re-run-on-dependency-change semantics.
      useEffect(() => {
        const cleanup = cb()
        return typeof cleanup === 'function' ? cleanup : undefined
      }, config?.dependencies ?? [])
    },
  }
})

import EffectAuthenticity from '../EffectAuthenticity'

function renderEffect(tier: 'console' | 'sheet' = 'console', imageUrl: string | null = null) {
  return render(<EffectAuthenticity sectionKey="authenticity" imageUrl={imageUrl} tier={tier} />)
}

const glyphText = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-auth="glyph"]'))
    .map((el) => el.textContent)
    .join('')

beforeEach(() => {
  motionState.reduced = false
})

describe('EffectAuthenticity — The Piece Verified', () => {
  it('mounts the full console rite on the designed fallback (no image) and unmounts cleanly', () => {
    const { container, unmount } = renderEffect()
    expect(container.querySelector('svg[data-passport-effect="authenticity"]')).toBeInTheDocument()
    // Every actor of the rite: read beam (authored hidden), seal rings, the
    // primary + echo shockwave pair, foil sheen, 10-glyph console checksum.
    expect(container.querySelector('[data-auth="beam"]')?.getAttribute('opacity')).toBe('0')
    expect(container.querySelector('[data-auth="beam-live"]')?.getAttribute('opacity')).toBe('0')
    expect(container.querySelector('[data-auth="seal-outer"]')).toBeInTheDocument()
    expect(container.querySelector('[data-auth="seal-inner"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-auth="shockwave"]')).toHaveLength(2)
    expect(container.querySelector('[data-auth="sheen"]')).toBeInTheDocument()
    // No silhouette → the stage-centered fallback: no contour to validate.
    expect(container.querySelector('[data-auth="edging"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-auth="pulse"]')).not.toBeInTheDocument()
    // The checksum is authored resolved — decorative fiction, never a serial.
    expect(glyphText(container)).toMatch(/^[A-F0-9]{10}$/)
    expect(() => unmount()).not.toThrow()
  })

  it('renders the lighter sheet variant: 8 glyphs, one shockwave', () => {
    const { container } = renderEffect('sheet')
    expect(glyphText(container)).toMatch(/^[A-F0-9]{8}$/)
    expect(container.querySelectorAll('[data-auth="shockwave"]')).toHaveLength(1)
  })

  it('reduced motion renders the authored still: seal + resolved checksum at rest, transients hidden', () => {
    motionState.reduced = true
    const { container, unmount } = renderEffect()
    // The ceremony sits at its authored rest alpha (0.6 — a strong fixture,
    // never furniture) with zero GSAP work…
    expect(container.querySelector('[data-auth="ceremony"]')?.getAttribute('opacity')).toBe('0.6')
    // …and every transient actor is authored hidden: no scan pass, no
    // shockwaves, no foil sheen. The rite is at rest.
    expect(container.querySelector('[data-auth="beam"]')?.getAttribute('opacity')).toBe('0')
    for (const el of container.querySelectorAll('[data-auth="shockwave"]')) {
      expect(el.getAttribute('opacity')).toBe('0')
    }
    expect(container.querySelector('[data-auth="sheen"]')?.getAttribute('opacity')).toBe('0')
    expect(glyphText(container)).toMatch(/^[A-F0-9]{10}$/)
    expect(() => unmount()).not.toThrow()
  })

  it('holds the at-rest markup while a decode can never finish (jsdom pending) and unmounts cleanly', () => {
    // jsdom never fires Image onload/onerror by default: the sample promise
    // stays pending, the rite waits (layout null → zero GSAP) and the
    // authored still stands on the fallback layout.
    const { container, unmount } = renderEffect('console', 'https://cdn.test/piece.png')
    expect(container.querySelector('[data-auth="seal-outer"]')).toBeInTheDocument()
    expect(container.querySelector('[data-auth="beam"]')?.getAttribute('opacity')).toBe('0')
    expect(container.querySelector('[data-auth="edging"]')).not.toBeInTheDocument()
    expect(() => unmount()).not.toThrow()
  })

  it('boots the fallback rite after a failed decode (sample resolves null) and unmounts cleanly', async () => {
    class FailingImage {
      crossOrigin = ''
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.())
      }
    }
    // Documented cast: the stand-in only implements the handler/src surface
    // the shared sampler's loader uses.
    vi.stubGlobal('Image', FailingImage as unknown as typeof Image)
    try {
      const { container, unmount } = renderEffect('console', 'https://cdn.test/piece.png')
      // Flush the failed decode → null sample → fallback layout → the useGSAP
      // callback re-runs (dependency change) and builds the fallback timeline.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      expect(container.querySelector('[data-auth="seal-outer"]')).toBeInTheDocument()
      expect(container.querySelector('[data-auth="edging"]')).not.toBeInTheDocument()
      expect(glyphText(container)).toMatch(/^[A-F0-9]{10}$/)
      expect(() => unmount()).not.toThrow()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
