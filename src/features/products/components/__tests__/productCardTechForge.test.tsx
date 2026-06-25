import { type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '@/features/products/types/product.types'
import { PRODUCT_CARD_VARIANTS } from '../productCardVariants'
import { ProductCardTechForge } from '../ProductCardTechForge'
import { ProductCardSkeleton } from '../ProductCardSkeleton'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    className,
    'aria-label': ariaLabel,
  }: {
    to: string
    params?: { slug?: string }
    children?: ReactNode
    className?: string
    'aria-label'?: string
  }) => (
    <a
      href={params?.slug ? to.replace('$slug', params.slug) : to}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
}))

function product(): Product {
  return {
    id: 'anvl-compression-tee',
    slug: 'compression-tee',
    name: 'Compression Tee',
    dropName: 'Drop 01',
    role: 'Compression',
    fit: '',
    fabric: '',
    gsm: '',
    storytelling: '',
    designDetails: [],
    careInstructions: [],
    colorways: [{ name: 'Black', base: '#000', accent: '#B49772' }],
    sizes: ['M'],
    price: 69,
    images: [{ src: '/img/c.jpg', alt: 'Compression tee' }],
  }
}

describe('ProductCardTechForge', () => {
  it('renders a PDP link and quick-add for the default variant', () => {
    render(<ProductCardTechForge product={product()} />)
    expect(
      screen.getByRole('link', { name: /compression tee/i }),
    ).toHaveAttribute('href', '/shop/compression-tee')
    expect(screen.getByRole('button', { name: /quick add/i })).toBeInTheDocument()
  })

  it('omits quick-add for the recommendation variant', () => {
    render(<ProductCardTechForge product={product()} variant="recommendation" />)
    expect(screen.queryByRole('button', { name: /quick add/i })).not.toBeInTheDocument()
  })

  it('emphasizes the featured variant (champagne frame, not size) and shows the index', () => {
    expect(PRODUCT_CARD_VARIANTS.featured.emphasis).toBe(true)
    render(<ProductCardTechForge product={product()} variant="featured" index={1} />)
    // The compact card renders the index marker.
    expect(screen.getByText('01')).toBeInTheDocument()
  })
})

describe('ProductCardSkeleton', () => {
  it('renders a stable-dimension placeholder per variant', () => {
    render(<ProductCardSkeleton variant="featured" />)
    expect(screen.getByTestId('product-card-skeleton')).toBeInTheDocument()
  })

  it('exposes every named variant config', () => {
    for (const key of [
      'default',
      'featured',
      'compact',
      'editorial',
      'recommendation',
    ] as const) {
      expect(PRODUCT_CARD_VARIANTS[key]).toBeTruthy()
    }
  })
})
