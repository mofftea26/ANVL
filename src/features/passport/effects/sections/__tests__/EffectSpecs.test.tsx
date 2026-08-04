import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { PassportEffectFacts } from '../../effectFacts'

/* Repo test rule: never run real animation libs in jsdom. `useReducedMotion`
   is swapped for a switch, and GSAP for a chainable no-op — but the useGSAP
   mock still invokes the callback post-mount (real hook timing) so the
   timeline-building path and its cleanup actually execute. The sampling path
   needs no mock: jsdom never decodes images, so `Image.onload` never fires
   and the effect stays on the guarded fallback layout. */
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

import EffectSpecs from '../EffectSpecs'

/** Mirrors what `buildPassportEffectFacts` emits for an authored passport:
 *  the Specifications card's stats, in the card's own order. */
const facts = (specs: Array<[string, string]>): PassportEffectFacts => ({
  blueprint: [],
  // Markers are authored with a position; spread them down the piece so
  // placement-dependent assertions have plausible coordinates.
  specs: specs.map(([label, value], i) => ({ label, value, x: 50, y: 25 + i * 18 })),
  fit: [],
})

/** One stat, placed exactly where the test wants it on the render. */
const placedAt = (x: number, y: number): PassportEffectFacts => ({
  blueprint: [],
  specs: [{ label: 'Chest', value: '52 cm', x, y }],
  fit: [],
})

const FULL = facts([
  ['Construction', 'Flatlock'],
  ['Fit type', 'Compressive'],
  ['Compression', 'High'],
  ['Stretch', '4-way'],
])

function renderSpecs(
  tier: 'console' | 'sheet' = 'console',
  imageUrl: string | null = null,
  effectFacts: PassportEffectFacts | undefined = FULL,
) {
  return render(<EffectSpecs sectionKey="specs" imageUrl={imageUrl} facts={effectFacts} tier={tier} />)
}

const texts = (container: HTMLElement, sel: string) =>
  Array.from(container.querySelectorAll(sel)).map((el) => el.textContent)

beforeEach(() => {
  motionState.reduced = false
})

describe('EffectSpecs — Live Analysis', () => {
  it('mounts the console analysis HUD and unmounts cleanly', () => {
    const { container, unmount } = renderSpecs()
    expect(container.querySelector('svg[data-passport-effect="specs"]')).toBeInTheDocument()
    // Console tier: 3 rails on the piece, each with a leader + plated chip.
    expect(container.querySelectorAll('[data-sa="anchor"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-sa="leader"]')).toHaveLength(3)
    // The chips are the passed facts — the Specifications card's own stats,
    // in the card's order. Never constants, never customer data or serials.
    expect(texts(container, '[data-sa="chip"]')).toEqual([
      'CONSTRUCTION · Flatlock',
      'FIT TYPE · Compressive',
      'COMPRESSION · High',
    ])
    // The orbiting reticle and the console's instrument tag are present.
    expect(container.querySelector('[data-sa="reticle-spin"]')).toBeInTheDocument()
    expect(container.querySelector('[data-sa="status-dot"]')).toBeInTheDocument()
    expect(container.querySelector('[data-sa="readout"]')).toBeInTheDocument()
    expect(() => unmount()).not.toThrow()
  })

  it('renders the lighter sheet variant (2 chips, no readout, no tag)', () => {
    const { container } = renderSpecs('sheet')
    expect(container.querySelectorAll('[data-sa="anchor"]')).toHaveLength(2)
    // Fewer rails ⇒ fewer facts, taken from the FRONT of the same list.
    expect(texts(container, '[data-sa="chip"]')).toEqual([
      'CONSTRUCTION · Flatlock',
      'FIT TYPE · Compressive',
    ])
    expect(container.querySelector('[data-sa="readout"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-sa="status"]')).not.toBeInTheDocument()
    // The reticle still hops between the two — continuous life on mobile too.
    expect(container.querySelector('[data-sa="reticle"]')).toBeInTheDocument()
  })

  it('shows one chip per authored stat when there are fewer stats than rails', () => {
    const { container } = renderSpecs('console', null, facts([['Stretch', '4-way']]))
    expect(container.querySelectorAll('[data-sa="anchor"]')).toHaveLength(1)
    expect(texts(container, '[data-sa="chip"]')).toEqual(['STRETCH · 4-way'])
  })

  /* Rendered directly rather than through the helper: the `undefined` case is
     prop OMISSION, which a defaulted helper argument would silently undo. */
  it.each([
    ['no authored stats', facts([])],
    ['no facts prop at all', undefined],
  ])('renders no chips with %s, but keeps the shape-reading band', (_label, effectFacts) => {
    const { container, unmount } = render(
      <EffectSpecs sectionKey="specs" imageUrl={null} facts={effectFacts} tier="console" />,
    )
    // Honesty rule: an unauthored passport gets NO invented readouts — no
    // chips, no leaders, no anchors-with-labels, and nothing to orbit.
    expect(container.querySelectorAll('[data-sa="chip"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-sa="chipbox"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-sa="anchor"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-sa="leader"]')).toHaveLength(0)
    expect(container.querySelector('[data-sa="reticle"]')).not.toBeInTheDocument()
    // …but the half that reads the garment's own geometry still mounts: the
    // scan band, its live intercept segment and both edge dots are true
    // without any authored copy.
    expect(container.querySelector('[data-sa="band"]')).toBeInTheDocument()
    expect(container.querySelector('[data-sa="band-live"]')).toBeInTheDocument()
    expect(container.querySelector('[data-sa="band-seg"]')).toBeInTheDocument()
    expect(container.querySelector('[data-sa="edge-l"]')).toBeInTheDocument()
    expect(container.querySelector('[data-sa="edge-r"]')).toBeInTheDocument()
    expect(container.querySelector('[data-sa="readout"]')).toBeInTheDocument()
    expect(() => unmount()).not.toThrow()
  })

  it('reduced motion renders the authored still: anchors lit, chips typed, no sweep', () => {
    motionState.reduced = true
    const { container, unmount } = renderSpecs()
    // Anchors + fully typed chips are present without any GSAP work…
    expect(container.querySelectorAll('[data-sa="anchor"]')).toHaveLength(3)
    expect(texts(container, '[data-sa="chip"]')).toEqual([
      'CONSTRUCTION · Flatlock',
      'FIT TYPE · Compressive',
      'COMPRESSION · High',
    ])
    // …leaders are authored fully drawn…
    for (const el of container.querySelectorAll('[data-sa="leader"]')) {
      expect(el.getAttribute('stroke-dashoffset')).toBe('0')
    }
    // …and the transient furniture (scan band, ping rings) stays hidden.
    expect(container.querySelector('[data-sa="band"]')?.getAttribute('opacity')).toBe('0')
    for (const el of container.querySelectorAll('[data-sa="ping"]')) {
      expect(el.getAttribute('opacity')).toBe('0')
    }
    // The reticle is parked visible on the first anchor (lit, not orbiting).
    expect(container.querySelector('[data-sa="reticle"]')).toBeInTheDocument()
    expect(() => unmount()).not.toThrow()
  })

  /* Placement. jsdom measures every box as 0x0, so `useContainedMediaRect`
     yields nothing and the solver falls back to its garment inset — region
     x 52 w 296, y 65 h 370 of the 400x500 stage. Percentages therefore land
     on round numbers, which is what makes the maths readable here. */
  it('anchors a chip where the editor placed it, not where a recipe put it', () => {
    const { container } = renderSpecs('console', null, placedAt(25, 20))
    // 25% across the IMAGE, 20% down it — measured from the image's own rect.
    expect(container.querySelector('[data-sa="anchor"]')?.getAttribute('transform')).toBe(
      'translate(126.0 139.0)',
    )
  })

  it('runs a placed chip to the stage edge NEAREST its marker', () => {
    const left = renderSpecs('console', null, placedAt(15, 50))
    expect(left.container.querySelector('[data-sa="chip"]')?.getAttribute('text-anchor')).toBe('start')
    left.unmount()
    const right = renderSpecs('console', null, placedAt(85, 50))
    expect(right.container.querySelector('[data-sa="chip"]')?.getAttribute('text-anchor')).toBe('end')
  })

  it('falls back to the silhouette recipe for a stat with no usable position', () => {
    // A coordinate that is not a number is not a placement — the stat keeps
    // the geometry that shipped before markers existed (ANCHOR_RECIPES[0]).
    const { container } = renderSpecs('console', null, {
      blueprint: [],
      specs: [{ label: 'Chest', value: '52 cm', x: Number.NaN, y: Number.NaN }],
      fit: [],
    })
    expect(container.querySelector('[data-sa="anchor"]')?.getAttribute('transform')).toBe(
      'translate(215.6 139.3)',
    )
    // …and it still says exactly what the passport says.
    expect(texts(container, '[data-sa="chip"]')).toEqual(['CHEST · 52 cm'])
  })

  it('mounts on the fallback layout while an image can never decode (jsdom)', () => {
    // Sampling is guarded: Image never fires onload here, so the profile stays
    // pending and the authored fallback still stands — mount/unmount clean.
    const { container, unmount } = renderSpecs('console', 'https://example.com/x.png')
    expect(container.querySelectorAll('[data-sa="anchor"]')).toHaveLength(3)
    expect(container.querySelector('[data-sa="band"]')?.getAttribute('opacity')).toBe('0')
    expect(() => unmount()).not.toThrow()
  })

  /* The per-row edge-profile unit tests moved with the sampler to
     src/features/passport/effects/lib/__tests__/silhouette2d.test.ts. */
})
