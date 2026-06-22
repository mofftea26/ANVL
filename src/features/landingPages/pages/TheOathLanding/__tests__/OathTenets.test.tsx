import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OathTenets } from '../components/OathTenets'
import { OATH_DEFAULT_CONTENT } from '../content/oathContent.defaults'

describe('OathTenets', () => {
  it('renders all four vows with titles and motion hooks', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )

    const section = container.querySelector('[data-scene="tenets"]')
    expect(section).not.toBeNull()
    expect(section!.querySelector('[data-tenet-stage]')).not.toBeNull()
    expect(section!.querySelector('[data-tenet-track]')).not.toBeNull()
    expect(section!.querySelector('[data-tenet-eyebrow]')).not.toHaveTextContent('')
    expect(section!.querySelectorAll('[data-tenet]')).toHaveLength(4)
    expect(section!.querySelectorAll('[data-tenet-media]')).toHaveLength(4)

    for (const tenet of OATH_DEFAULT_CONTENT.tenets.items) {
      expect(screen.getByText(tenet.title)).toBeInTheDocument()
      expect(section!.querySelector(`[data-tenet="${tenet.id}"]`)).not.toBeNull()
      expect(
        section!.querySelector(`[data-tenet-media="${tenet.id}"]`),
      ).not.toBeNull()
    }
  })

  it('exposes per-vow content hooks for editorial markup', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )
    const section = container.querySelector('[data-scene="tenets"]')!

    expect(section.querySelectorAll('[data-tenet-index]')).toHaveLength(4)
    expect(section.querySelectorAll('[data-tenet-title]')).toHaveLength(4)
    expect(section.querySelectorAll('[data-tenet-line]')).toHaveLength(4)
    expect(section.querySelectorAll('[data-tenet-marker]')).toHaveLength(4)
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
