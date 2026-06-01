/**
 * @vitest-environment jsdom
 */
import { render, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'
import { BrandShowcaseExperience } from '@/features/marketing/default-landing/BrandShowcaseExperience'
import {
  BRAND_SHOWCASE_BEATS,
  BRAND_SHOWCASE_CLOSING_CHOREO,
  BRAND_SHOWCASE_SCROLL_END,
} from '@/features/marketing/default-landing/brandShowcaseAssets'

vi.mock('@/shared/lib/gsap', () => ({
  gsap: {
    matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }),
    context: vi.fn(() => ({ revert: vi.fn() })),
    set: vi.fn(),
    to: vi.fn(),
    from: vi.fn(),
    fromTo: vi.fn(),
    utils: { toArray: vi.fn(() => []) },
  },
  useGSAP: vi.fn(),
}))

vi.mock('@/shared/components/ui/SafeLink', () => ({
  SafeLink: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    className?: string
  } & Record<string, unknown>) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

const landing = {
  hero: {
    actLabel: 'Act I — Forge',
    badgeText: 'ANVL Athletics',
    title: 'Forged Under Pressure',
    subtitle: 'Premium gymwear.',
    primaryCta: { label: 'Explore Drop 01', href: '/drop/the-oath' },
    secondaryCta: { label: 'Join Waitlist', href: '#waitlist' },
    meta: [],
  },
  manifesto: {
    actLabel: 'Act II — Manifesto',
    heading: 'Built For Discipline',
    intro: 'Every piece earns its place.',
    tenets: [{ id: 't1', text: 'No shortcuts.', isVisible: true }],
  },
  pieces: {
    actLabel: 'Act III — Pieces',
    headingLineOne: 'The',
    headingLineTwo: 'Collection',
    viewAllHref: '/shop',
    viewAllLabel: 'View all',
    footerLeftText: 'Drop 01',
  },
  dropReveal: {
    tagline: 'The oath awaits.',
    primaryCta: { label: 'Explore Drop 01', href: '/drop/the-oath' },
    secondaryCta: { label: 'Shop the collection', href: '/shop' },
  },
} as unknown as LandingPageCmsContent

const sampleProducts: Product[] = Array.from({ length: 3 }, (_, i) => ({
  id: `prod-${i + 1}`,
  slug: `product-${i + 1}`,
  name: `Product ${i + 1}`,
  dropName: 'Drop 01',
  role: 'Top',
  fit: 'Regular',
  fabric: 'Cotton',
  gsm: '280',
  storytelling: '',
  designDetails: [],
  careInstructions: [],
  price: 100,
  images: [],
  colorways: [],
  sizes: [],
  shop: {
    storefrontStatus: 'available',
    sourceType: 'drop',
    dropId: null,
    dropSlug: null,
    compareAtPrice: null,
    listPrice: 100,
    currency: 'USD',
    category: 'tops',
    availabilityByColorAndSize: {},
    imagesByColorName: {},
  },
}))

describe('BrandShowcaseExperience', () => {
  it('renders hero, manifesto, and closing CTA from CMS copy', () => {
    render(<BrandShowcaseExperience landing={landing} products={[]} />)

    const stage = document.querySelector('[data-brand-stage]') as HTMLElement
    expect(
      within(stage).getByRole('heading', { level: 1, name: 'Forged Under Pressure' }),
    ).toBeInTheDocument()
    const exploreLinks = within(stage).getAllByRole('link', {
      name: 'Explore Drop 01',
    })
    expect(exploreLinks.some((el) => el.getAttribute('href') === '/drop/the-oath')).toBe(
      true,
    )
    expect(
      within(stage).getByRole('heading', { level: 2, name: 'Built For Discipline' }),
    ).toBeInTheDocument()
    expect(within(stage).getByText('No shortcuts.')).toBeInTheDocument()
    const closing = stage.querySelector('[data-brand-closing-root]') as HTMLElement
    expect(
      within(closing).getByRole('link', { name: 'Shop the collection' }),
    ).toHaveAttribute('href', '/shop')

    const warriorVideo = document.querySelector(
      '[data-brand-hero-warrior-video]',
    ) as HTMLVideoElement | null
    expect(warriorVideo).toBeInTheDocument()
    expect(warriorVideo).toHaveAttribute('src', '/videos/WarriorHero1.mp4')
    expect(warriorVideo?.muted).toBe(true)
    expect(warriorVideo?.playsInline).toBe(true)
  })

  it('uses one pinned stage with film-timeline beat layers', () => {
    render(<BrandShowcaseExperience landing={landing} products={[]} />)

    const showcase = document.querySelector('[data-brand-showcase]')
    const stage = document.querySelector('[data-brand-stage]')
    const heroStack = document.querySelector('[data-brand-hero-stack]')
    const reducedStack = document.querySelector('[data-brand-reduced-stack]')

    expect(showcase).toBeInTheDocument()
    expect(stage).toBeInTheDocument()
    expect(stage).toHaveClass('hidden')
    expect(stage).toHaveClass('md:block')
    expect(stage).toHaveClass('min-h-[100dvh]')
    expect(document.querySelector('[data-brand-beat="hero"]')).toBeInTheDocument()
    expect(document.querySelector('[data-brand-beat="manifesto"]')).toBeInTheDocument()
    expect(document.querySelector('[data-brand-beat="closing"]')).toBeInTheDocument()
    expect(document.querySelector('[data-brand-tunnel]')).toBeNull()
    expect(document.querySelector('[data-brand-hero-forge]')).toBeNull()

    expect(heroStack).toHaveClass('fixed')
    expect(heroStack).toHaveClass('inset-0')
    expect(document.querySelectorAll('[data-brand-hero-copy]').length).toBeGreaterThanOrEqual(5)

    expect(reducedStack).toHaveClass('block')
    expect(reducedStack).toHaveClass('md:hidden')
    expect(reducedStack?.querySelectorAll('[data-brand-scroll-section]').length).toBeGreaterThanOrEqual(3)
  })

  it('exports scroll beat choreography constants for the master timeline', () => {
    expect(BRAND_SHOWCASE_SCROLL_END).toBe('+=400%')
    expect(BRAND_SHOWCASE_BEATS.heroIn).toBe(0)
    expect(BRAND_SHOWCASE_BEATS.heroOut).toBeLessThan(BRAND_SHOWCASE_BEATS.manifestoIn)
    expect(BRAND_SHOWCASE_BEATS.manifestoOut).toBeLessThan(BRAND_SHOWCASE_BEATS.productsIn)
    expect(BRAND_SHOWCASE_BEATS.productsOut).toBeLessThan(BRAND_SHOWCASE_BEATS.closingIn)
    expect(BRAND_SHOWCASE_BEATS.closingIn).toBeGreaterThanOrEqual(0.78)
    expect(BRAND_SHOWCASE_BEATS.closingOut).toBe(1)
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.shellIn).toBe(BRAND_SHOWCASE_BEATS.closingIn)
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.emblemStart).toBe(BRAND_SHOWCASE_BEATS.closingIn)
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.ctaEnterEnd).toBe(1)
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.eyebrowStart).toBeGreaterThanOrEqual(
      BRAND_SHOWCASE_CLOSING_CHOREO.emblemEnd,
    )
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.headlineStart).toBeGreaterThanOrEqual(
      BRAND_SHOWCASE_CLOSING_CHOREO.eyebrowEnd,
    )
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.introStart).toBeGreaterThanOrEqual(
      BRAND_SHOWCASE_CLOSING_CHOREO.headlineEnd,
    )
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.ctaShopStart).toBeGreaterThanOrEqual(
      BRAND_SHOWCASE_CLOSING_CHOREO.introEnd,
    )
    expect(BRAND_SHOWCASE_CLOSING_CHOREO.ctaEnterStart).toBeGreaterThanOrEqual(
      BRAND_SHOWCASE_CLOSING_CHOREO.ctaShopEnd,
    )
  })

  it('exposes closing beat GSAP targets for staged scroll reveals', () => {
    render(<BrandShowcaseExperience landing={landing} products={[]} />)

    const stage = document.querySelector('[data-brand-stage]') as HTMLElement
    const closing = stage.querySelector('[data-brand-beat="closing"]') as HTMLElement

    expect(closing.querySelector('[data-brand-closing-emblem]')).toBeInTheDocument()
    expect(closing.querySelector('[data-brand-closing-eyebrow]')).toBeInTheDocument()
    expect(closing.querySelectorAll('[data-brand-closing-word]').length).toBe(3)
    expect(closing.querySelector('[data-brand-closing-intro]')).toBeInTheDocument()
    expect(closing.querySelector('[data-brand-closing-cta-shop]')).toBeInTheDocument()
    expect(closing.querySelector('[data-brand-closing-cta-enter]')).toBeInTheDocument()
  })

  it('keeps pinned products beat free of internal scroll containers', () => {
    render(<BrandShowcaseExperience landing={landing} products={sampleProducts} />)

    const stage = document.querySelector('[data-brand-stage]') as HTMLElement
    const productsBeat = stage.querySelector('[data-brand-beat="products"]') as HTMLElement
    const productGrid = productsBeat.querySelector('[data-brand-product-grid]') as HTMLElement

    expect(productsBeat).toBeInTheDocument()
    expect(productsBeat.className).toMatch(/overflow-hidden/)
    expect(productGrid.className).not.toMatch(/overflow-y-auto/)
    expect(productGrid.className).not.toMatch(/52dvh/)
    expect(productGrid.className).toMatch(/grid-cols-3/)
    expect(productGrid.className).toMatch(/flex-1/)
    expect(productGrid.className).toMatch(/auto-rows-fr/)
    expect(productsBeat.querySelectorAll('[data-brand-product]').length).toBe(3)
    expect(productsBeat.querySelectorAll('[data-brand-product-img]').length).toBe(3)
    expect(productsBeat.querySelectorAll('.brand-product-banner').length).toBe(3)

    const productsRoot = productsBeat.querySelector('[data-brand-products]') as HTMLElement
    expect(productsRoot.className).toMatch(/h-full/)
    expect(productsRoot.className).toMatch(/min-h-0/)
  })
})
