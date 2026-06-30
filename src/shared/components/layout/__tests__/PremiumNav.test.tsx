/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LandingNavigationContent } from '@/features/cms/navigation/navigation.types'
import { useCartStore } from '@/features/cart/store/cart.store'

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

    // The cart control opens the mini-cart drawer (a button, not a link now).
    const cartButtons = screen.getAllByLabelText('Open cart, 2 items')
    expect(cartButtons.length).toBeGreaterThan(0)
    expect(cartButtons[0]).toHaveTextContent('2')
  })

  it('renders a fixed transparent overlay header (over the hero) with no bottom border', () => {
    const { container } = render(<PremiumNav navigation={baseNavigation} />)
    const header = container.querySelector('header')
    expect(header).toHaveAttribute('data-premium-nav-position', 'overlay')
    expect(header?.className).toMatch(/\bfixed\b/)
    expect(header?.className).not.toMatch(/\bsticky\b/)
    // The topbar must not paint a bottom border in any state.
    const topbar = container.querySelector('[data-premium-topbar]')
    expect(topbar?.className).not.toMatch(/border-b/)
  })
})
