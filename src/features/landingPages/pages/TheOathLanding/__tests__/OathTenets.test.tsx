import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OathTenets } from '../components/OathTenets'
import { OATH_DEFAULT_CONTENT } from '../content/oathContent.defaults'

const TENET_COUNT = OATH_DEFAULT_CONTENT.tenets.items.length

describe('OathTenets', () => {
  it('renders all characteristics with titles and motion hooks', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )

    const section = container.querySelector('[data-scene="tenets"]')
    expect(section).not.toBeNull()
    expect(section!.querySelector('[data-tenet-stage]')).not.toBeNull()
    expect(section!.querySelector('[data-tenet-track]')).not.toBeNull()
    expect(section!.querySelector('[data-tenet-eyebrow]')).not.toHaveTextContent('')
    expect(section!.querySelectorAll('[data-tenet]')).toHaveLength(TENET_COUNT)
    expect(section!.querySelectorAll('[data-tenet-media]')).toHaveLength(TENET_COUNT)

    for (const tenet of OATH_DEFAULT_CONTENT.tenets.items) {
      expect(screen.getByText(tenet.title)).toBeInTheDocument()
      const panel = section!.querySelector(`[data-tenet="${tenet.id}"]`)
      expect(panel).not.toBeNull()
      expect(panel!.querySelector('[data-tenet-media]')).not.toBeNull()
    }
  })

  it('exposes per-characteristic content hooks for editorial markup', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )
    const section = container.querySelector('[data-scene="tenets"]')!

    expect(section.querySelectorAll('[data-tenet-index]')).toHaveLength(TENET_COUNT)
    expect(section.querySelectorAll('[data-tenet-title]')).toHaveLength(TENET_COUNT)
    expect(section.querySelectorAll('[data-tenet-sub]')).toHaveLength(TENET_COUNT)
    expect(section.querySelectorAll('[data-tenet-marker]')).toHaveLength(TENET_COUNT)
    // Each product carries its annotation points.
    expect(section.querySelectorAll('[data-hotspot]').length).toBeGreaterThanOrEqual(TENET_COUNT)
  })

  it('places callouts on the roomy side of the point (data-side contract)', () => {
    const tenets = structuredClone(OATH_DEFAULT_CONTENT.tenets)
    const first = tenets.items[0]!
    first.hotspots = [
      { ...first.hotspots[0]!, id: 'hs-left-half', x: 20, y: 50 },
      { ...first.hotspots[0]!, id: 'hs-right-half', x: 80, y: 50 },
    ]
    const { container } = render(<OathTenets tenets={tenets} />)

    const leftHalf = container.querySelector('[data-hotspot="hs-left-half"]')!
    const rightHalf = container.querySelector('[data-hotspot="hs-right-half"]')!
    // Point in the LEFT half → card extends RIGHT (and vice versa); the line
    // and card carry the side so the GSAP builder can set matching origins.
    expect(leftHalf.querySelector('[data-hotspot-line]')!.getAttribute('data-side')).toBe('right')
    expect(leftHalf.querySelector('[data-hotspot-card]')!.getAttribute('data-side')).toBe('right')
    expect(rightHalf.querySelector('[data-hotspot-line]')!.getAttribute('data-side')).toBe('left')
    expect(rightHalf.querySelector('[data-hotspot-card]')!.getAttribute('data-side')).toBe('left')
  })

  it('is hidden below xl (desktop-only panorama)', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )
    const section = container.querySelector('[data-scene="tenets"]')
    expect(section!.className).toMatch(/\bhidden\b/)
    expect(section!.className).toMatch(/\bxl:block\b/)
  })

  it('uses editorial left rail and default top seam (creed hand-off)', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )
    const section = container.querySelector('[data-scene="tenets"]')!
    const stage = section.querySelector('[data-tenet-stage]')!
    const rail = section.querySelector('[data-tenet-eyebrow]')!.parentElement!
      .parentElement!
      .parentElement!

    expect(section.className).not.toMatch(/\bxl:-mt-64\b/)
    expect(rail.className).not.toMatch(/\bborder-r\b/)
    expect(rail.className).not.toMatch(/bg-\[var\(--color-bg\)\]/)
    expect(stage.querySelector('[data-scene-seam="top"]')).not.toBeNull()
    expect(stage.querySelector('[data-scene-seam="top"]')!.getAttribute('data-scene-seam-tone')).toBe(
      'default',
    )
    const bottomSeam = stage.querySelector('[data-scene-seam="bottom"]')
    expect(bottomSeam).not.toBeNull()
    expect(bottomSeam!.parentElement).toBe(stage)
    expect(section.querySelectorAll('[data-scene-seam="bottom"]')).toHaveLength(1)
  })
})
