import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OathFinale } from '../components/OathFinale'
import { OATH_DEFAULT_CONTENT } from '../content/oathContent.defaults'

const finale = {
  ...OATH_DEFAULT_CONTENT.finale,
  primaryCta: { label: 'Shop Drop 01', href: '#products' },
  secondaryCta: { label: 'Our Story', href: '#story' },
}

describe('OathFinale', () => {
  it('renders the finale title and CTAs', () => {
    render(<OathFinale finale={finale} />)
    expect(screen.getByRole('heading', { name: finale.title })).toBeInTheDocument()
    expect(screen.getByText('Shop Drop 01')).toBeInTheDocument()
    expect(screen.getByText('Our Story')).toBeInTheDocument()
  })

  it('scales the crest emblem prominently at every breakpoint', () => {
    const { container } = render(<OathFinale finale={finale} />)
    const crestSizer = container.querySelector('[data-finale-crest] > *')
    expect(crestSizer).not.toBeNull()
    expect(crestSizer!.className).toMatch(/\bh-64\b/)
    expect(crestSizer!.className).toMatch(/\bw-64\b/)
    expect(crestSizer!.className).toMatch(/\bmd:h-72\b/)
    expect(crestSizer!.className).toMatch(/\bmd:w-72\b/)
    expect(crestSizer!.className).toMatch(/\bxl:h-80\b/)
    expect(crestSizer!.className).toMatch(/\bxl:w-80\b/)

    const mark = crestSizer!.querySelector('.inline-flex')
    expect(mark).not.toBeNull()
    expect(mark!.className).toMatch(/\bh-full\b/)
    expect(mark!.className).toMatch(/\bw-full\b/)
  })

  it('feathers the top edge on mobile/tablet to dissolve from products', () => {
    const { container } = render(<OathFinale finale={finale} />)
    const section = container.querySelector('[data-scene="finale"]')
    expect(section).not.toBeNull()

    const topSeams = section!.querySelectorAll('[data-scene-seam="top"]')
    expect(topSeams).toHaveLength(2)

    const mobileTop = topSeams[0]!
    expect(mobileTop.getAttribute('data-scene-seam-tone')).toBe('subtle')
    expect(mobileTop.className).toMatch(/\bxl:hidden\b/)

    const desktopTop = topSeams[1]!
    expect(desktopTop.getAttribute('data-scene-seam-tone')).toBe('blend')
    expect(desktopTop.className).toMatch(/\bhidden\b/)
    expect(desktopTop.className).toMatch(/\bxl:block\b/)
  })

  it('applies xl alpha mask on the section for transparent blend from products', () => {
    const { container } = render(<OathFinale finale={finale} />)
    const section = container.querySelector('[data-scene="finale"]')
    expect(section).not.toBeNull()
    expect(section!.className).toMatch(/xl:\[mask-image:linear-gradient\(to_bottom,transparent_0%/)
  })
})
