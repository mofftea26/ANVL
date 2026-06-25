import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Product } from '@/features/products/types/product.types'
import { useCartStore } from '@/features/cart/store/cart.store'
import { ProductCardQuickAdd } from '../ProductCardQuickAdd'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'anvl-compression-tee',
    slug: 'compression-tee',
    name: 'Compression Tee',
    dropName: 'Drop 01: The Oath',
    role: 'Compression',
    fit: '',
    fabric: '',
    gsm: '',
    storytelling: '',
    designDetails: [],
    careInstructions: [],
    colorways: [{ name: 'Black', base: '#000', accent: '#B49772' }],
    sizes: ['S', 'M', 'L'],
    price: 69,
    images: [{ src: '/img/compression.jpg', alt: 'Compression tee' }],
    ...overrides,
  }
}

beforeEach(() => {
  useCartStore.getState().clear()
})

describe('ProductCardQuickAdd', () => {
  it('opens, selects a size, and adds the line to the cart', () => {
    render(<ProductCardQuickAdd product={makeProduct()} />)

    fireEvent.click(screen.getByRole('button', { name: /quick add/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('option', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: /add —/i }))

    const lines = useCartStore.getState().lines
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      productId: 'anvl-compression-tee',
      size: 'M',
      price: 69,
      quantity: 1,
    })
  })

  it('announces the cart update for screen readers', () => {
    render(<ProductCardQuickAdd product={makeProduct()} />)
    fireEvent.click(screen.getByRole('button', { name: /quick add/i }))
    fireEvent.click(screen.getByRole('option', { name: 'L' }))
    fireEvent.click(screen.getByRole('button', { name: /add —/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/added to cart/i)
  })

  it('shows a disabled sold-out control and never opens for out-of-stock products', () => {
    const soldOut = makeProduct({
      shop: {
        storefrontStatus: 'outOfStock',
        sourceType: 'drop',
        dropId: null,
        dropSlug: null,
        compareAtPrice: null,
        listPrice: 69,
        currency: 'USD',
        category: 'tops',
        availabilityByColorAndSize: {},
        imagesByColorName: {},
      },
    })
    render(<ProductCardQuickAdd product={soldOut} />)
    const btn = screen.getByRole('button', { name: /sold out/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useCartStore.getState().lines).toHaveLength(0)
  })
})
