import type { AdminProduct } from '@/features/admin/products/products.types'

export function slugifyProductHandle(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'piece'
}

export function uniqueProductSlug(desiredBase: string, catalog: AdminProduct[]): string {
  const base = slugifyProductHandle(desiredBase)
  const taken = new Set(catalog.map((p) => p.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
