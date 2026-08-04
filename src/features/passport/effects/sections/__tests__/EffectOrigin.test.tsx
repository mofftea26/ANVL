import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

/* Repo test rule: never run real animation libs in jsdom. `useReducedMotion`
   is swapped for a switch, and GSAP for a chainable no-op — but the useGSAP
   mock still invokes the callback post-mount (real hook timing) so the
   timeline-building path and its cleanup actually execute. Sampling needs no
   mock: jsdom never loads images, so `Image.onload`/`onerror` never fire and
   an imageUrl keeps the effect on the pending (fallback still) beat, while a
   null imageUrl resolves the fallback layout synchronously and animates. */
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
  return { gsap: { timeline: () => chain, to: () => chain, fromTo: () => chain } }
})

vi.mock('@gsap/react', async () => {
  const { useEffect } = await import('react')
  return {
    useGSAP: (cb: () => void | (() => void), _config?: unknown) => {
      useEffect(() => {
        const cleanup = cb()
        return typeof cleanup === 'function' ? cleanup : undefined
      }, [])
    },
  }
})

import EffectOrigin from '../EffectOrigin'

function renderOrigin(tier: 'console' | 'sheet' = 'console', imageUrl: string | null = null) {
  return render(<EffectOrigin sectionKey="origin" imageUrl={imageUrl} tier={tier} />)
}

beforeEach(() => {
  motionState.reduced = false
})

describe('EffectOrigin — The Journey to This Piece', () => {
  it('mounts the console journey on the fixed fallback layout and unmounts cleanly', () => {
    // imageUrl null → sample null → the designed fallback: classic fixed pin,
    // FULL graticule (no occlusion mask), route + life intact.
    const { container, unmount } = renderOrigin()
    expect(container.querySelector('svg[data-passport-effect="origin"]')).toBeInTheDocument()
    // 5 meridians + 3 parallels; no occlusion polygon without a silhouette.
    expect(container.querySelectorAll('[data-oe="graticule"] path')).toHaveLength(8)
    expect(container.querySelector('[data-oe="occl-poly"]')).toBeNull()
    // The course + its draw-on mask copy, waypoint lights along it.
    expect(container.querySelector('[data-oe="route"]')).toBeInTheDocument()
    expect(container.querySelector('[data-oe="route-draw"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-oe="waypoint"]')).toHaveLength(5)
    // The pin and the kept latitude whisper beside it.
    expect(container.querySelector('[data-oe="pin"]')).toBeInTheDocument()
    expect(container.querySelector('[data-oe="coords"]')?.textContent).toContain('33.8')
    // Continuous life: landing ring, two pulse rings, survey ping, compass.
    expect(container.querySelector('[data-oe="land-ring"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-oe="ring-pulse"]')).toHaveLength(2)
    expect(container.querySelector('[data-oe="survey"]')).toBeInTheDocument()
    expect(container.querySelector('[data-oe="compass"]')).toBeInTheDocument()
    expect(container.querySelector('[data-oe="needle"]')).toBeInTheDocument()
    // Animated variant — the reduced-motion resting ring is absent.
    expect(container.querySelector('[data-oe="ring-static"]')).toBeNull()
    expect(() => unmount()).not.toThrow()
  })

  it('runs the lighter sheet variant: 3 waypoints, 1 pulse ring, no survey ping', () => {
    const { container } = renderOrigin('sheet')
    expect(container.querySelectorAll('[data-oe="waypoint"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-oe="ring-pulse"]')).toHaveLength(1)
    expect(container.querySelector('[data-oe="survey"]')).toBeNull()
    // The compass whisper stays — the sheet keeps the quiet life.
    expect(container.querySelector('[data-oe="compass"]')).toBeInTheDocument()
  })

  it('reduced motion renders the authored still: drawn route, resting ring, no ping/twinkle', () => {
    motionState.reduced = true
    const { container, unmount } = renderOrigin()
    // Route pre-drawn (draw-mask dashoffset 0); chart, pin and compass fully
    // present straight from attributes — no animation clock ever runs.
    expect(container.querySelector('[data-oe="route-draw"]')?.getAttribute('stroke-dashoffset')).toBe('0')
    expect(container.querySelector('[data-oe="graticule"]')?.getAttribute('opacity')).toBe('1')
    expect(container.querySelector('[data-oe="pin"]')?.getAttribute('opacity')).toBe('1')
    expect(container.querySelector('[data-oe="coords"]')).toBeInTheDocument()
    expect(container.querySelector('[data-oe="compass"]')?.getAttribute('opacity')).toBe('1')
    // Waypoints rest lit at their authored opacity.
    for (const el of container.querySelectorAll('[data-oe="waypoint"]')) {
      expect(el.getAttribute('opacity')).toBe('0.55')
    }
    // One resting ring replaces every animated emitter.
    expect(container.querySelector('[data-oe="ring-static"]')).toBeInTheDocument()
    expect(container.querySelector('[data-oe="ring-pulse"]')).toBeNull()
    expect(container.querySelector('[data-oe="survey"]')).toBeNull()
    expect(container.querySelector('[data-oe="land-ring"]')).toBeNull()
    expect(() => unmount()).not.toThrow()
  })

  it('mounts the fallback still while an image can never decode (jsdom)', () => {
    // Sampling is guarded: jsdom never loads the image, so the shape stays
    // pending — the fallback layout renders authored-at-rest (route drawn,
    // pin standing) with no occlusion mask, and teardown is clean.
    const { container, unmount } = renderOrigin('console', 'https://example.com/x.png')
    expect(container.querySelector('[data-oe="pin"]')?.getAttribute('opacity')).toBe('1')
    expect(container.querySelector('[data-oe="route-draw"]')?.getAttribute('stroke-dashoffset')).toBe('0')
    expect(container.querySelector('[data-oe="occl-poly"]')).toBeNull()
    expect(container.querySelectorAll('[data-oe="waypoint"]')).toHaveLength(5)
    expect(() => unmount()).not.toThrow()
  })
})
