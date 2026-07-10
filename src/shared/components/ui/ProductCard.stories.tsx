import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Product } from '@/features/products/types/product.types'
import { ProductCard } from './ProductCard'

const baseProduct: Product = {
  id: 'oversized-tee',
  slug: 'oversized-tee',
  name: 'The Oath Oversized Tee',
  dropName: 'Drop 01 — The Oath',
  role: 'Oversized Tee',
  fit: 'Oversized, dropped shoulder',
  fabric: '240gsm heavyweight cotton',
  gsm: '240',
  storytelling: 'Carved through pressure, repetition, discipline, and heat.',
  designDetails: ['Dropped shoulder', 'Boxy fit', 'Back graphic'],
  careInstructions: ['Cold wash', 'Hang dry'],
  colorways: [
    { name: 'Onyx', base: '#0B0B0C', accent: '#5B5E61' },
    { name: 'Bone', base: '#E7E4DF', accent: '#B49772' },
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  price: 48,
  images: [{ src: '/brand/placeholder-product.svg', alt: 'The Oath Oversized Tee, front' }],
}

const meta: Meta<typeof ProductCard> = {
  title: 'Components/ProductCard',
  component: ProductCard,
  args: { product: baseProduct },
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof ProductCard>

export const Default: Story = {
  decorators: [(Story) => <div className="w-72"><Story /></div>],
}

export const OnSale: Story = {
  args: {
    product: {
      ...baseProduct,
      name: 'The Oath Stringer',
      role: 'Stringer',
      price: 38,
      shop: {
        storefrontStatus: 'sale',
        sourceType: 'drop',
        dropId: 'drop-01',
        dropSlug: 'the-oath',
        compareAtPrice: 48,
        listPrice: 48,
        currency: 'USD',
        category: 'apparel',
        availabilityByColorAndSize: {},
        imagesByColorName: {},
      },
    },
  },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
}
