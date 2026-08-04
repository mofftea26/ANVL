import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { PassportEffectFacts } from '../../effectFacts'

/* Repo test rule: never run real animation libs in jsdom. `useReducedMotion`
   is swapped for a switch, and GSAP for a chainable no-op — but the useGSAP
   mock still invokes the callback post-mount (real hook timing) so the
   timeline-building path and its cleanup actually execute. The sampling path
   needs no mock: jsdom never decodes images, so `Image.onload` never fires
   and the effect stays on the designed fallback layout. */
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
    useGSAP: (cb: () => void | (() => void), _config?: unknown) => {
      useEffect(() => {
        const cleanup = cb()
        return typeof cleanup === 'function' ? cleanup : undefined
      }, [])
    },
  }
})

import EffectFit from '../EffectFit'

/** Only `fit` matters here; the other lists belong to sibling effects. */
// Markers are authored with a position; these fixtures spread them down the
// garment so placement-dependent assertions have plausible coordinates.
const withFit = (fit: Array<{ label: string; value: string }>): PassportEffectFacts => ({
  blueprint: [],
  specs: [],
  fit: fit.map((m, i) => ({ ...m, x: 50, y: 30 + i * 22 })),
})

const MEASURED = withFit([
  { label: 'Chest', value: '52 cm' },
  { label: 'Waist', value: '48 cm' },
  { label: 'Hem', value: '50.5 cm' },
])

function renderFit(
  tier: 'console' | 'sheet' = 'console',
  imageUrl: string | null = null,
  facts?: PassportEffectFacts,
) {
  return render(<EffectFit sectionKey="fit" imageUrl={imageUrl} tier={tier} facts={facts} />)
}

const texts = (container: HTMLElement, sel: string) =>
  Array.from(container.querySelectorAll(sel)).map((el) => el.textContent)

/**
 * The stage's settled type scale, in viewBox units. Written out here rather
 * than read off `FIT_TYPE`, so that moving the scale has to move a test too —
 * "the size readouts are different sizes" is a report nobody can re-derive
 * from the source six months from now.
 */
const TYPE = { value: 21, label: 11, whisper: 11, caption: 7.5 } as const

const size = (el: Element) => Number(el.getAttribute('font-size'))
const sizes = (container: HTMLElement, sel: string) =>
  Array.from(container.querySelectorAll(sel)).map(size)

/** Each tape's height, read off the path it draws (`M lx y Q …`). */
const bandYs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-fit-tape]')).map((el) =>
    Number((el.getAttribute('d') ?? '').split(' ')[2]),
  )

beforeEach(() => {
  motionState.reduced = false
})

describe('EffectFit — Tailored to the Body', () => {
  it('mounts the console tailor composition on the fallback layout and unmounts cleanly', () => {
    const { container, unmount } = renderFit('console', null, MEASURED)
    expect(container.querySelector('svg[data-passport-effect="fit"]')).toBeInTheDocument()
    expect(container.querySelector('svg[data-fit-motion="animated"]')).toBeInTheDocument()
    // Three fitted bands — tape, graduations, two end caps, a wrap head, and
    // a labelled measurement each.
    const bands = Array.from(container.querySelectorAll('[data-fit-band]'))
    expect(bands).toHaveLength(3)
    for (const band of bands) {
      expect(band.querySelector('[data-fit-tape]')).not.toBeNull()
      expect(band.querySelectorAll('[data-fit-tick]').length).toBeGreaterThan(0)
      expect(band.querySelectorAll('[data-fit-cap]')).toHaveLength(2)
      expect(band.querySelector('[data-fit-head]')).not.toBeNull()
    }
    // The size whisper and the console atelier tag.
    expect(container.querySelectorAll('[data-fit-size]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-fit-size-glow]')).toHaveLength(4)
    expect(container.querySelector('[data-fit-tag]')).toBeInTheDocument()
    // No silhouette ⇒ no outline ⇒ the pin runner and its pins do not exist.
    expect(container.querySelector('[data-fit-runner]')).toBeNull()
    expect(container.querySelectorAll('[data-fit-pin]')).toHaveLength(0)
    expect(() => unmount()).not.toThrow()
  })

  it('reads the passport: every band shows an AUTHORED label and value verbatim', () => {
    const { container } = renderFit('console', null, MEASURED)
    expect(texts(container, '[data-fit-label]')).toEqual(['Chest', 'Waist', 'Hem'])
    // Verbatim — no unit invented, no rounding, no re-casing in the DOM
    // (uppercase is CSS presentation only).
    expect(texts(container, '[data-fit-value]')).toEqual(['52 cm', '48 cm', '50.5 cm'])
  })

  it('renders a reading that cannot be counted exactly as written', () => {
    const { container } = renderFit('console', null, withFit([{ label: 'Chest', value: '48–50 cm' }]))
    expect(texts(container, '[data-fit-value]')).toEqual(['48–50 cm'])
  })

  it('makes NO numeric claim without facts: tapes and geometry, zero text', () => {
    for (const facts of [undefined, withFit([])]) {
      const { container, unmount } = renderFit('console', null, facts)
      // The tapes still state the shape...
      expect(container.querySelectorAll('[data-fit-band]')).toHaveLength(3)
      expect(container.querySelectorAll('[data-fit-tape]')).toHaveLength(3)
      expect(container.querySelectorAll('[data-fit-cap]')).toHaveLength(6)
      // ...and say nothing about centimetres. No invented fallback scale.
      expect(container.querySelectorAll('[data-fit-value]')).toHaveLength(0)
      expect(container.querySelectorAll('[data-fit-label]')).toHaveLength(0)
      // The whisper is atmosphere, not data — it stays either way.
      expect(container.querySelectorAll('[data-fit-size]')).toHaveLength(4)
      unmount()
    }
  })

  it('carries values on only as many bands as the passport authored', () => {
    const { container } = renderFit('console', null, withFit([{ label: 'Chest', value: '52 cm' }]))
    expect(container.querySelectorAll('[data-fit-band]')).toHaveLength(3)
    expect(texts(container, '[data-fit-value]')).toEqual(['52 cm'])
    expect(texts(container, '[data-fit-label]')).toEqual(['Chest'])
  })

  /* Placement. jsdom measures every box as 0x0, so `useContainedMediaRect`
     yields nothing and the solver falls back to its garment inset — y 65,
     h 370 of the 500-unit stage — which is what makes these numbers round. */
  it('wraps each tape at the height its measurement was authored at', () => {
    const { container } = renderFit(
      'console',
      null,
      // Deliberately NOT the chest/waist/hem recipe heights (0.30/0.55/0.80).
      {
        blueprint: [],
        specs: [],
        fit: [
          { label: 'Sleeve', value: '22 cm', x: 50, y: 20 },
          { label: 'Chest', value: '52 cm', x: 50, y: 55 },
          { label: 'Hem', value: '50.5 cm', x: 50, y: 90 },
        ],
      },
    )
    expect(bandYs(container)).toEqual([139, 268.5, 398])
  })

  it('orders placed measurements down the piece, ignoring the label rule', () => {
    // "Chest" no longer claims the chest tape: the editor pointed at the hem
    // end of the render, so its tape wraps there and the topmost marker owns
    // the topmost tape.
    const { container } = renderFit('console', null, {
      blueprint: [],
      specs: [],
      fit: [
        { label: 'Chest', value: '52 cm', x: 50, y: 90 },
        { label: 'Hem', value: '50.5 cm', x: 50, y: 10 },
      ],
    })
    expect(texts(container, '[data-fit-label]')).toEqual(['Hem', 'Chest'])
    expect(bandYs(container).slice(0, 2)).toEqual([102, 398])
  })

  it('keeps the label rule for measurements with no usable position', () => {
    // A coordinate that is not a number is not a placement, so "Chest" claims
    // the chest row even though it was authored second, and the unnamed
    // reading takes the next free row rather than displacing it.
    const loose = (label: string, value: string) => ({ label, value, x: Number.NaN, y: Number.NaN })
    const { container } = renderFit('console', null, {
      blueprint: [],
      specs: [],
      fit: [loose('Sleeve', '22 cm'), loose('Chest', '52 cm')],
    })
    expect(texts(container, '[data-fit-label]')).toEqual(['Chest', 'Sleeve'])
    // …and the tapes stay on the frozen chest/waist recipe heights.
    expect(bandYs(container)).toEqual([176, 268.5, 361])
  })

  it('renders the lighter sheet variant: two bands, no tag, whisper kept', () => {
    const { container } = renderFit('sheet', null, MEASURED)
    // Two tapes on mobile, so the two highest-placed readings are the ones
    // shown — each still at its own height, so nothing is re-labelled onto a
    // tape that is not its own. The third is dropped rather than crowded in.
    expect(container.querySelectorAll('[data-fit-band]')).toHaveLength(2)
    expect(texts(container, '[data-fit-label]')).toEqual(['Chest', 'Waist'])
    expect(texts(container, '[data-fit-value]')).toEqual(['52 cm', '48 cm'])
    expect(container.querySelector('[data-fit-tag]')).toBeNull()
    // Continuous life stays on mobile too — the whisper still breathes.
    expect(container.querySelectorAll('[data-fit-size]')).toHaveLength(4)
  })

  it('reduced motion renders the authored still: bands + readings present, no runner', () => {
    motionState.reduced = true
    const { container, unmount } = renderFit('console', null, MEASURED)
    expect(container.querySelector('svg[data-fit-motion="still"]')).toBeInTheDocument()
    // Tapes are authored fully drawn with their measurements final...
    expect(container.querySelectorAll('[data-fit-band]')).toHaveLength(3)
    for (const tape of container.querySelectorAll('[data-fit-tape]')) {
      expect(tape.getAttribute('stroke-dashoffset')).toBe('0')
    }
    expect(texts(container, '[data-fit-value]')).toEqual(['52 cm', '48 cm', '50.5 cm'])
    // ...the transient furniture stays hidden: wrap heads and the champagne
    // whisper twins never light without the clock, and no runner circulates.
    for (const head of container.querySelectorAll('[data-fit-head]')) {
      expect(head.getAttribute('opacity')).toBe('0')
    }
    for (const glow of container.querySelectorAll('[data-fit-size-glow]')) {
      expect(glow.getAttribute('opacity')).toBe('0')
    }
    expect(container.querySelector('[data-fit-runner]')).toBeNull()
    expect(() => unmount()).not.toThrow()
  })

  it('mounts on the fallback layout while an image can never decode (jsdom)', () => {
    // Sampling is guarded: Image never fires onload here, so the profile
    // stays pending and the authored fallback still stands — clean lifecycle.
    const { container, unmount } = renderFit('console', 'https://example.com/x.png', MEASURED)
    expect(container.querySelectorAll('[data-fit-band]')).toHaveLength(3)
    expect(container.querySelector('[data-fit-runner]')).toBeNull()
    expect(() => unmount()).not.toThrow()
  })

  it('sizes readings as the dominant type and keeps them inside the stage', () => {
    // The reading a customer may act on is the biggest text here, and it is
    // clamped so a long authored string can never run off the 400-unit stage.
    const { container } = renderFit('console', null, withFit([
      { label: 'Chest', value: '52 cm' },
      { label: 'Waist', value: 'Approximately 48' },
    ]))
    const values = Array.from(container.querySelectorAll('[data-fit-value]'))
    const labels = Array.from(container.querySelectorAll('[data-fit-label]'))
    // Still the dominant type, and above every other tier on the stage.
    expect(size(values[0])).toBeGreaterThan(TYPE.whisper)
    expect(size(values[0])).toBeGreaterThan(size(labels[0]))
    for (const value of values) {
      const x = Number(value.getAttribute('x'))
      const room = value.getAttribute('text-anchor') === 'start' ? 400 - x : x
      expect(room).toBeGreaterThanOrEqual((value.textContent ?? '').length * 0.62 * size(value) - 0.01)
    }
  })

  /* Type. The user's report was that the size readouts came out at different
     sizes — they were sized once per band, so a cramped tape rendered its
     reading smaller than its neighbours and, at worst, smaller than the
     decorative whisper underneath. These numbers are the settled scale. */
  it('draws every reading at ONE size and every term at ONE size', () => {
    const { container } = renderFit('console', null, MEASURED)
    expect(sizes(container, '[data-fit-value]')).toEqual([TYPE.value, TYPE.value, TYPE.value])
    expect(sizes(container, '[data-fit-label]')).toEqual([TYPE.label, TYPE.label, TYPE.label])
  })

  it('holds one reading size even when one authored string is long', () => {
    const { container } = renderFit('console', null, withFit([
      { label: 'Chest', value: '52 cm' },
      { label: 'Waist', value: 'Approximately 48' },
    ]))
    // Down together, not one of them alone.
    const values = sizes(container, '[data-fit-value]')
    expect(new Set(values).size).toBe(1)
    expect(values[0]).toBeLessThan(TYPE.value)
    expect(new Set(sizes(container, '[data-fit-label]')).size).toBe(1)
  })

  it('puts the size whisper on the SAME step as a term, not between tiers', () => {
    const { container } = renderFit('console', null, MEASURED)
    // The whisper's size lives on the group that wraps the glyph cells.
    const whisper = container.querySelector('[data-fit-size]')?.parentElement
    expect(Number(whisper?.getAttribute('font-size'))).toBe(TYPE.whisper)
    expect(TYPE.whisper).toBe(TYPE.label)
    // The atelier tag is the one step below — a signature, not information.
    expect(size(container.querySelector('[data-fit-tag] text') as Element)).toBe(TYPE.caption)
    expect(TYPE.caption).toBeLessThan(TYPE.label)
  })

  it('keeps the whisper right-anchored and evenly spaced at that size', () => {
    const { container } = renderFit('console', null, MEASURED)
    const xs = Array.from(container.querySelectorAll('[data-fit-size] text[data-fit-size-glow]')).map(
      (el) => Number(el.getAttribute('x')),
    )
    expect(xs).toHaveLength(4)
    // The strip is composed from its right end, so XL stays put whatever the
    // scale does; the rest step inward by ems of the whisper's own size.
    expect(xs[3]).toBe(374)
    expect(xs[0]).toBeLessThan(xs[1])
    expect(xs[1] - xs[0]).toBeCloseTo(xs[2] - xs[1], 6)
    expect(xs[3] - xs[2]).toBeGreaterThan(xs[2] - xs[1])
  })
})
