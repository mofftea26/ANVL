/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LandingNavigationContent } from '@/features/cms/landing/landingPageCms.types'
import { useCartStore } from '@/features/cart/store/cart.store'
import { useCinematicHeroPhaseStore } from '@/features/marketing/cinematic-hero/cinematicHeroPhase.store'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
    'aria-label': ariaLabel,
  }: {
    to: string
    children: React.ReactNode
    className?: string
    'aria-label'?: string
  }) => (
    <a href={to} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}))

import { PremiumNav } from '@/shared/components/layout/PremiumNav'

const baseNavigation: LandingNavigationContent = {
  headerLinks: [
    { id: 'shop', label: 'Shop', href: '/shop', isVisible: true },
  ],
  footerLinks: [],
  footerTagline: '',
  footerMicroCaption: '',
  newsletterTitle: '',
  newsletterPlaceholder: '',
  newsletterButtonText: '',
  cartVisible: true,
}

describe('PremiumNav', () => {
  beforeEach(() => {
    useCartStore.setState({ lines: [] })
    useCinematicHeroPhaseStore.getState().reset()
  })

  it('renders primary navigation links on desktop topbar', () => {
    render(<PremiumNav navigation={baseNavigation} />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop')
  })

  it('shows cart quantity badge when cart has items', () => {
    useCartStore.setState({
      lines: [
        {
          productId: 'p1',
          slug: 'test',
          name: 'Test',
          price: 10,
          colorway: 'Black',
          size: 'M',
          quantity: 2,
          image: '/x.jpg',
        },
      ],
    })

    render(<PremiumNav navigation={baseNavigation} />)

    const cartLinks = screen.getAllByLabelText('Cart, 2 items')
    expect(cartLinks.length).toBeGreaterThan(0)
    expect(cartLinks[0]).toHaveTextContent('2')
  })

  it('uses transparent topbar variant during cinematic phase', () => {
    useCinematicHeroPhaseStore.getState().setPhase('cinematic')
    const { container } = render(<PremiumNav navigation={baseNavigation} />)
    expect(
      container.querySelector('[data-premium-topbar-variant="transparent"]'),
    ).not.toBeNull()
  })

  it('keeps header and cart ghost styling during cinematic phase', () => {
    useCinematicHeroPhaseStore.getState().setPhase('cinematic')
    const { container } = render(<PremiumNav navigation={baseNavigation} />)
    const header = container.querySelector('header')
    expect(header?.className).toMatch(/bg-transparent/)
    const cart = container.querySelector('a[aria-label^="Cart"]')
    expect(cart?.className).toMatch(/bg-white\/5/)
    expect(cart?.className).not.toMatch(/color-surface/)
  })

  it('overlays the hero with fixed positioning during cinematic phase', () => {
    useCinematicHeroPhaseStore.getState().setPhase('cinematic')
    const { container } = render(<PremiumNav navigation={baseNavigation} />)
    const header = container.querySelector('header')
    expect(header).toHaveAttribute('data-premium-nav-position', 'overlay')
    expect(header?.className).toMatch(/\bfixed\b/)
    expect(header?.className).not.toMatch(/\bsticky\b/)
  })

  it('does not render mobile flow spacer while nav overlays the hero', () => {
    useCinematicHeroPhaseStore.getState().setPhase('cinematic')
    const { container } = render(<PremiumNav navigation={baseNavigation} />)
    expect(
      container.querySelector('.h-\\[calc\\(56px\\+env\\(safe-area-inset-bottom'),
    ).toBeNull()
  })

  it('keeps sticky in-flow header during commerce phase', () => {
    useCinematicHeroPhaseStore.getState().setPhase('commerce')
    const { container } = render(<PremiumNav navigation={baseNavigation} />)
    const header = container.querySelector('header')
    expect(header).toHaveAttribute('data-premium-nav-position', 'flow')
    expect(header?.className).toMatch(/\bsticky\b/)
    expect(header?.className).not.toMatch(/\bfixed\b/)
  })
})
