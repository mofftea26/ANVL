import type { AdminProduct, ProductStatus } from '@/features/admin/products/products.types'

export {
  isoToDatetimeLocalValue as productEditorToDatetimeLocal,
  localInputToIso as productEditorFromDatetimeLocal,
} from '@/features/admin/lib/adminDateTime'

export const PRODUCT_STATUSES: ProductStatus[] = [
  'draft',
  'active',
  'inactive',
  'comingSoon',
  'outOfStock',
  'sale',
  'archived',
]

export function cloneProduct(p: AdminProduct): AdminProduct {
  return structuredClone(p)
}
