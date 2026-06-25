import { createRef, type ReactNode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '@/features/products/types/product.types'

// The Theoath Modern card uses TanStack <Link>; stub it to a plain anchor so the
// card renders without a RouterProvider.
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
import { TM_DEFAULT_CONTENT } from '../content/theoathModernContent.defaults'
import { TmHotspot } from '../components/TmHotspot'
import { TmCollection } from '../components/TmCollection'
import { TmHero } from '../components/TmHero'
import { TmMotionContext, createTmMotionState } from '../motion/tmMotionState'

function product(slug: string, name: string, price: number): Product {
  return {
    id: `anvl-${slug}`,
    slug,
    name,
    dropName: 'Drop 01: The Oath',
    role: 'Test piece',
    fit: '',
    fabric: '',
    gsm: '',
    storytelling: '',
    designDetails: [],
    careInstructions: [],
    colorways: [],
    sizes: ['M'],
    price,
    images: [{ src: `/img/${slug}.jpg`, alt: name }],
  }
}

const PRODUCTS = [
  product('oversized-tee', 'Oversized Tee', 59),
  product('stringer', 'Stringer', 49),
  product('compression-tee', 'Compression Tee', 69),
]

describe('TmHotspot', () => {
  it('is an accessible button that discloses its line on activation', () => {
    render(<TmHotspot hotspot={TM_DEFAULT_CONTENT.hero.hotspots[0]} />)
    const button = screen.getByRole('button', {
      name: TM_DEFAULT_CONTENT.hero.hotspots[0].label,
    })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('TmCollection', () => {
  it('renders exactly three pieces with the compression shirt featured first', () => {
    render(<TmCollection content={TM_DEFAULT_CONTENT} products={PRODUCTS} />)
    const links = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('/shop/'))
    expect(links).toHaveLength(3)
    // The hero (compression) card is first.
    expect(links[0].getAttribute('href')).toBe('/shop/compression-tee')
    // All three pieces render their names.
    expect(screen.getByText('Compression Tee')).toBeInTheDocument()
    expect(screen.getByText('Oversized Tee')).toBeInTheDocument()
    expect(screen.getByText('Stringer')).toBeInTheDocument()
  })
})

describe('TmHero', () => {
  it('renders the default headline, CTAs, and accessible hotspots', () => {
    const motion = createTmMotionState()
    render(
      <TmMotionContext.Provider value={motion}>
        <TmHero
          root={createRef<HTMLElement>()}
          content={TM_DEFAULT_CONTENT}
          heroProduct={PRODUCTS[2]}
          heroProductPng={null}
        />
      </TmMotionContext.Provider>,
    )
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent('Engineered To Endure.')
    expect(
      screen.getByRole('link', { name: TM_DEFAULT_CONTENT.hero.primaryCta.label }),
    ).toBeInTheDocument()
    // Hotspots are real buttons (one on the stage per hotspot).
    expect(
      screen.getAllByRole('button', {
        name: TM_DEFAULT_CONTENT.hero.hotspots[0].label,
      }).length,
    ).toBeGreaterThan(0)
  })
})
