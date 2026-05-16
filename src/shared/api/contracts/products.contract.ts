/**
 * Product / catalog API contracts — storefront reads + admin catalog writes.
 *
 * Medusa split: **Medusa** — variants, prices, inventory, cart line SKUs.
 * **ANVL CMS / BFF** — drop assignments (`dropIds`), editorial copy, merchandising, SEO.
 */

import type { AdminProduct, ProductStatus } from '@/features/admin/products/products.types'
import type { Product } from '@/features/products/types/product.types'
import type { DateRangeFilter, ListSort, OffsetPaginatedResult, OffsetPaginationQuery } from './common.types'

export const PRODUCTS_API_PREFIX = '/api/products' as const

export type StorefrontProductListResponse = Product[]

export type StorefrontProductBySlugResponse = Product | null

export type AdminProductListSortField =
  | 'updatedAt'
  | 'createdAt'
  | 'releaseDate'
  | 'price'
  | 'status'
  | 'name'

export type AdminProductListQuery = OffsetPaginationQuery & {
  search?: string
  status?: ProductStatus | 'all'
  dropId?: string | 'unassigned'
  sourceType?: 'drop' | 'individual' | 'all'
  category?: string
  color?: string
  sellableVariants?: 'any' | 'none'
  updatedBetween?: DateRangeFilter
  releaseBetween?: DateRangeFilter
  sort?: ListSort<AdminProductListSortField>
}

export type AdminProductListResponse = OffsetPaginatedResult<AdminProduct>

export type AdminProductCreateBody = Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

export type AdminProductUpdateBody = Partial<Omit<AdminProduct, 'id' | 'createdAt'>> & {
  updatedAt?: string
}
