import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Product } from '@/features/products/types/product.types'
import type { PdpContentConfig } from '@/features/cms/pdpContent/pdpContent.zod'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import { ProductPickerModal } from '../ProductPickerModal'

function makeProduct(over: Partial<Product> & Pick<Product, 'slug' | 'name'>): Product {
  return {
    id: over.slug,
    dropName: 'The Oath',
    role: '',
    fit: '',
    fabric: '',
    gsm: '',
    storytelling: '',
    designDetails: [],
    careInstructions: [],
    colorways: [],
    sizes: [],
    price: 50,
    images: [{ src: 'https://cdn.example.com/i.jpg', alt: 'x' }],
    ...over,
  } as Product
}

const products: Product[] = [
  makeProduct({
    slug: 'oath-tee',
    name: 'Oath Tee',
    shop: { category: 'Tops', fit: 'Oversized', tags: ['cotton'] } as Product['shop'],
  }),
  makeProduct({
    slug: 'forge-shorts',
    name: 'Forge Shorts',
    shop: { category: 'Bottoms', fit: 'Classic', tags: ['mesh'] } as Product['shop'],
  }),
]

const pdpContent: PdpContentConfig = {
  'oath-tee': { ...DEFAULT_PDP_PRODUCT_CONTENT, storyBody: 'Authored.' },
}

describe('ProductPickerModal', () => {
  it('renders a card per product with an authored marker', () => {
    render(
      <ProductPickerModal
        open
        onClose={vi.fn()}
        products={products}
        pdpContent={pdpContent}
        selectedSlug="oath-tee"
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText('Oath Tee')).toBeInTheDocument()
    expect(screen.getByText('Forge Shorts')).toBeInTheDocument()
    // Only the authored product shows the "Authored" badge (scoped to the card
    // grid — the authored-state filter row also has an "Authored" chip).
    const grid = screen.getByRole('list')
    expect(within(grid).getAllByText('Authored')).toHaveLength(1)
  })

  it('filters cards by the debounced search box', async () => {
    render(
      <ProductPickerModal
        open
        onClose={vi.fn()}
        products={products}
        pdpContent={{}}
        selectedSlug=""
        onSelect={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'shorts' } })
    await waitFor(() => expect(screen.queryByText('Oath Tee')).not.toBeInTheDocument())
    expect(screen.getByText('Forge Shorts')).toBeInTheDocument()
  })

  it('filters by a category chip', () => {
    render(
      <ProductPickerModal
        open
        onClose={vi.fn()}
        products={products}
        pdpContent={{}}
        selectedSlug=""
        onSelect={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bottoms' }))
    expect(screen.queryByText('Oath Tee')).not.toBeInTheDocument()
    expect(screen.getByText('Forge Shorts')).toBeInTheDocument()
  })

  it('fires onSelect + onClose when a card is chosen', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <ProductPickerModal
        open
        onClose={onClose}
        products={products}
        pdpContent={{}}
        selectedSlug=""
        onSelect={onSelect}
      />,
    )
    const list = screen.getByTestId('product-picker-modal')
    fireEvent.click(within(list).getByText('Forge Shorts'))
    expect(onSelect).toHaveBeenCalledWith('forge-shorts')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
