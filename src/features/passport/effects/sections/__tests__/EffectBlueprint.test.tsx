import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'

/**
 * The gate is what jsdom can meaningfully test — the three.js half never
 * renders here (mocked below; jsdom has no WebGL). These tests pin the mount
 * DECISION: closed under any failed capability leg (the console MQ carries
 * both the ≥1280px and reduced-motion legs), the sheet tier never mounts, a
 * null image never mounts, and an open gate mounts + unmounts the lazy
 * canvas cleanly — plus that the passport's real facts reach the canvas.
 *
 * What those facts then become — the plates' honesty contract and where an
 * authored marker puts them — is pure and three.js-free, so it is unit-tested
 * in `../../lib/__tests__/holoTags.test.ts` and the world mapping that feeds
 * it in `./effectBlueprintShaders.test.ts`.
 */

const webgl = vi.hoisted(() => ({ ok: false }))
vi.mock('@/shared/webgl/isWebglAvailable', () => ({
  isWebglAvailable: () => webgl.ok,
}))

// The real module would pull three.js into jsdom — replace it with a marker
// that also reports the facts it was handed, so the hand-off is observable.
vi.mock('../EffectBlueprintCanvas', () => ({
  default: ({ imageUrl, facts }: { imageUrl: string; facts?: PassportEffectFacts }) => (
    <div
      data-testid="blueprint-canvas-stub"
      data-image-url={imageUrl}
      data-fact-labels={(facts?.blueprint ?? []).map((fact) => fact.label).join('|')}
    />
  ),
}))

import EffectBlueprint from '../EffectBlueprint'
import type { PassportEffectMarker, PassportEffectFacts } from '../../effectFacts'

/** jsdom lacks matchMedia semantics — drive the console MQ deterministically. */
function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
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

const IMG = 'https://cdn.example/oath-tee.png'

/** Only `blueprint` matters to this effect; the other lists belong to siblings. */
const factsWith = (blueprint: PassportEffectMarker[]): PassportEffectFacts => ({
  blueprint,
  specs: [],
  fit: [],
})

describe('EffectBlueprint (gate)', () => {
  beforeEach(() => {
    webgl.ok = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders null when the console MQ does not match (narrow viewport / reduced motion)', async () => {
    webgl.ok = true
    stubMatchMedia(false)
    const { container } = render(
      <EffectBlueprint sectionKey="blueprint" imageUrl={IMG} tier="console" />,
    )
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('renders null when WebGL is unavailable even with the MQ matching', async () => {
    webgl.ok = false
    stubMatchMedia(true)
    const { container, unmount } = render(
      <EffectBlueprint sectionKey="blueprint" imageUrl={IMG} tier="console" />,
    )
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
    expect(() => unmount()).not.toThrow()
  })

  it('never mounts the canvas on the sheet tier, even fully capable', async () => {
    webgl.ok = true
    stubMatchMedia(true)
    const { container } = render(
      <EffectBlueprint sectionKey="blueprint" imageUrl={IMG} tier="sheet" />,
    )
    await act(async () => {})
    expect(screen.queryByTestId('blueprint-canvas-stub')).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders null without an image to project', async () => {
    webgl.ok = true
    stubMatchMedia(true)
    const { container } = render(
      <EffectBlueprint sectionKey="blueprint" imageUrl={null} tier="console" />,
    )
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('mounts the lazy canvas when the gate passes, and unmounts cleanly', async () => {
    webgl.ok = true
    stubMatchMedia(true)
    const { unmount } = render(
      <EffectBlueprint sectionKey="blueprint" imageUrl={IMG} tier="console" />,
    )
    const stub = await screen.findByTestId('blueprint-canvas-stub')
    expect(stub).toHaveAttribute('data-image-url', IMG)
    unmount()
    expect(screen.queryByTestId('blueprint-canvas-stub')).toBeNull()
  })

  it("hands the passport's real facts down to the canvas", async () => {
    webgl.ok = true
    stubMatchMedia(true)
    render(
      <EffectBlueprint
        sectionKey="blueprint"
        imageUrl={IMG}
        tier="console"
        facts={factsWith([
          { label: 'Cotton', value: '92% · 260 GSM', x: 50, y: 40 },
          { label: 'Construction', value: 'Flatlock seams', x: 50, y: 40 },
        ])}
      />,
    )
    const stub = await screen.findByTestId('blueprint-canvas-stub')
    expect(stub).toHaveAttribute('data-fact-labels', 'Cotton|Construction')
  })
})
