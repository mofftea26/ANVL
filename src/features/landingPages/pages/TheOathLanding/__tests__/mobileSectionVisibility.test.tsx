import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OathManifesto } from '../components/OathManifesto'
import { OathTenets } from '../components/OathTenets'
import { OATH_DEFAULT_CONTENT } from '../content/oathContent.defaults'

describe('OathManifesto mobile visibility', () => {
  it('is hidden below xl (desktop-only creed scene)', () => {
    const { container } = render(
      <OathManifesto manifesto={OATH_DEFAULT_CONTENT.manifesto} />,
    )
    const section = container.querySelector('[data-scene="manifesto"]')
    expect(section).not.toBeNull()
    expect(section!.className).toMatch(/\bhidden\b/)
    expect(section!.className).toMatch(/\bxl:flex\b/)
  })
})

describe('OathTenets mobile visibility', () => {
  it('is hidden below xl (desktop-only panorama)', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )
    const section = container.querySelector('[data-scene="tenets"]')
    expect(section).not.toBeNull()
    expect(section!.className).toMatch(/\bhidden\b/)
    expect(section!.className).toMatch(/\bxl:block\b/)
  })

  it('does not render a mobile card grid fallback', () => {
    const { container } = render(
      <OathTenets tenets={OATH_DEFAULT_CONTENT.tenets} />,
    )
    expect(container.querySelectorAll('[data-reveal-m]')).toHaveLength(0)
  })
})

describe('OathManifesto scene seams', () => {
  it('feathers hero top and default bottom into tenets on desktop', () => {
    const { container } = render(
      <OathManifesto manifesto={OATH_DEFAULT_CONTENT.manifesto} />,
    )
    const section = container.querySelector('[data-scene="manifesto"]')
    expect(section).not.toBeNull()
    expect(section!.querySelector('[data-scene-seam="top"]')).not.toBeNull()
    const bottom = section!.querySelector('[data-scene-seam="bottom"]')
    expect(bottom).not.toBeNull()
    expect(bottom!.getAttribute('data-scene-seam-tone')).toBe('default')
  })
})
