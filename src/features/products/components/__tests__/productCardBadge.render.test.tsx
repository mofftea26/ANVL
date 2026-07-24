import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Product, ProductShopMeta } from '@/features/products/types/product.types'
import { ProductCardBadge } from '../ProductCardBadge'

function makeProduct(shop?: Partial<ProductShopMeta>): Product {
  return {
    id: 'p',
    slug: 'p',
    name: 'Piece',
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
    price: 59,
    images: [],
    shop: shop
      ? {
          storefrontStatus: 'available',
          sourceType: 'drop',
          dropId: null,
          dropSlug: null,
          compareAtPrice: null,
          listPrice: 59,
          currency: 'USD',
          category: '',
          availabilityByColorAndSize: {},
          imagesByColorName: {},
          ...shop,
        }
      : undefined,
  }
}

describe('ProductCardBadge (render)', () => {
  it('renders the SALE chip for a discounted product', () => {
    render(
      <ProductCardBadge
        product={makeProduct({ storefrontStatus: 'sale', compareAtPrice: 74 })}
        showInventoryUrgency={false}
      />,
    )
    expect(screen.getByText('Sale')).toBeInTheDocument()
  })

  it('renders the SALE chip from compare-at pricing alone', () => {
    render(
      <ProductCardBadge
        product={makeProduct({ compareAtPrice: 74 })}
        showInventoryUrgency={false}
      />,
    )
    expect(screen.getByText('Sale')).toBeInTheDocument()
  })

  it('renders nothing for a full-price available product', () => {
    const { container } = render(
      <ProductCardBadge product={makeProduct({})} showInventoryUrgency={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
