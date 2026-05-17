import type { AdminProduct, ProductStatus } from '@/features/admin/products/products.types'

export const PRODUCT_STATUSES: ProductStatus[] = [
  'draft',
  'active',
  'inactive',
  'comingSoon',
  'outOfStock',
  'sale',
  'archived',
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function productEditorToDatetimeLocal(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function productEditorFromDatetimeLocal(value: string): string | undefined {
  const v = value.trim()
  if (!v) return undefined
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function cloneProduct(p: AdminProduct): AdminProduct {
  return structuredClone(p)
}
