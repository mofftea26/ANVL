/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  BannerStrip,
  bannerBackgroundStyle,
  type BannerStripProps,
} from '@/features/cms/banner/BannerStrip'
import { DEFAULT_BANNER_CONFIG } from '@/features/cms/banner/bannerConfig.zod'

const baseColors = { ...DEFAULT_BANNER_CONFIG.colors }

function renderStrip(overrides: Partial<BannerStripProps> = {}) {
  const props: BannerStripProps = {
    message: 'Drop 01 ships worldwide',
    href: null,
    linkLabel: '',
    imageUrl: null,
    colors: { ...baseColors },
    animation: 'none',
    ...overrides,
  }
  render(<BannerStrip {...props} />)
  return document.querySelector('[data-anvl-banner-strip]') as HTMLElement
}

describe('bannerBackgroundStyle', () => {
  it('builds a linear-gradient when both background stops are set', () => {
    expect(
      bannerBackgroundStyle({
        ...baseColors,
        background: '#111111',
        background2: '#222222',
        gradientAngle: 135,
      }),
    ).toEqual({ backgroundImage: 'linear-gradient(135deg, #111111, #222222)' })
  })

  it('stays solid when only the primary background is set', () => {
    expect(
      bannerBackgroundStyle({ ...baseColors, background: '#111111' }),
    ).toEqual({ backgroundColor: '#111111' })
  })

  it('falls back to the theme accent when background is blank — even with a lone background2', () => {
    expect(bannerBackgroundStyle({ ...baseColors })).toEqual({
      backgroundColor: 'var(--color-accent)',
    })
    // Documented: blank background + set background2 = solid theme fallback.
    expect(
      bannerBackgroundStyle({ ...baseColors, background2: '#222222' }),
    ).toEqual({ backgroundColor: 'var(--color-accent)' })
  })
})

describe('BannerStrip', () => {
  it('renders the message and applies the gradient background inline', () => {
    const strip = renderStrip({
      colors: {
        background: '#0b0b0c',
        background2: '#34373a',
        gradientAngle: 90,
        text: '#e7e4df',
      },
    })
    expect(screen.getByText('Drop 01 ships worldwide')).toBeInTheDocument()
    // jsdom normalizes hex → rgb(), so assert on the gradient shape + stops.
    expect(strip.style.backgroundImage).toContain('linear-gradient(90deg')
    expect(strip.style.backgroundImage).toContain('rgb(11, 11, 12)')
    expect(strip.style.backgroundImage).toContain('rgb(52, 55, 58)')
  })

  it.each([
    ['shimmer', 'anvl-banner-anim-shimmer'],
    ['pulse', 'anvl-banner-anim-pulse'],
  ] as const)('applies the %s animation class', (animation, className) => {
    const strip = renderStrip({ animation })
    expect(strip.dataset.anvlBannerAnimation).toBe(animation)
    expect(strip.classList.contains(className)).toBe(true)
  })

  it('applies gradient-shift only when a real gradient exists', () => {
    const strip = renderStrip({
      animation: 'gradient-shift',
      colors: {
        background: '#111111',
        background2: '#222222',
        gradientAngle: 90,
        text: '',
      },
    })
    expect(strip.classList.contains('anvl-banner-anim-gradient-shift')).toBe(true)
  })

  it('degrades gradient-shift to static when there is no second color', () => {
    const strip = renderStrip({ animation: 'gradient-shift' })
    expect(strip.dataset.anvlBannerAnimation).toBe('none')
    expect(strip.classList.contains('anvl-banner-anim-gradient-shift')).toBe(false)
  })

  it('marquee renders a seamless twin that is hidden from assistive tech', () => {
    renderStrip({
      animation: 'marquee',
      href: '/shop',
      linkLabel: 'Shop now',
    })
    // The message renders twice for the seamless loop…
    expect(screen.getAllByText('Drop 01 ships worldwide')).toHaveLength(2)
    // …but exactly one copy is aria-hidden, so AT reads it once.
    const hiddenCopies = document.querySelectorAll(
      '.anvl-banner-marquee-track > [aria-hidden="true"]',
    )
    expect(hiddenCopies).toHaveLength(1)

    // Only ONE link copy is focusable — the twin's is tabbed out.
    const links = screen.getAllByText('Shop now')
    expect(links).toHaveLength(2)
    const tabbable = links.filter((l) => l.getAttribute('tabindex') !== '-1')
    expect(tabbable).toHaveLength(1)
  })

  it('injects reduced-motion-gated CSS for the animations', () => {
    renderStrip({ animation: 'marquee' })
    const styleTag = document.querySelector('[data-anvl-banner-strip] style')
    expect(styleTag?.textContent).toContain(
      '@media (prefers-reduced-motion: no-preference)',
    )
    expect(styleTag?.textContent).toContain('anvl-banner-marquee')
  })

  it('without an animation renders the plain centered layout with a linked message', () => {
    renderStrip({ href: '/shop' })
    const link = screen.getByRole('link', { name: 'Drop 01 ships worldwide' })
    expect(link.getAttribute('href')).toBe('/shop')
    expect(document.querySelector('.anvl-banner-marquee-track')).toBeNull()
  })
})
