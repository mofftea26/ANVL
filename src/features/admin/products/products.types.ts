export type ProductStatus =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'comingSoon'
  | 'outOfStock'
  | 'sale'
  | 'archived'

export type ProductImage = {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  sortOrder: number
}

export type ProductColor = {
  id: string
  name: string
  hex: string
  images: ProductImage[]
}

export type ProductSize = {
  id: string
  label: string
  sortOrder: number
}

export type ProductVariantAvailability = {
  colorId: string
  sizeId: string
  sku?: string
  stockQuantity: number
  isAvailable: boolean
}

export type AdminProduct = {
  id: string
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number
  isOnSale: boolean
  saleLabel?: string
  status: ProductStatus
  isActive: boolean
  category: string
  tags: string[]
  colors: ProductColor[]
  sizes: ProductSize[]
  availability: ProductVariantAvailability[]
  dropIds: string[]
  details: {
    fit?: string
    fabric?: string
    gsm?: string
    construction?: string
    care?: string
    features?: string[]
  }
  seo: {
    title?: string
    description?: string
    ogImage?: string
  }
  createdAt: string
  updatedAt: string
}
