import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { AdminProduct, ProductSourceType } from './products.types'
import {
  createEmptyAdminProduct,
  createSeedAdminProductsFromMock,
} from './products.defaults'
import { readProductsRaw, writeProductsRaw, isBrowser } from './products.storage'
import { rebuildAvailabilityMatrix } from './products.matrix'

export type ProductsPersistedState = {
  products: AdminProduct[]
}

export function deriveSourceType(dropIds: string[]): ProductSourceType {
  return dropIds.length > 0 ? 'drop' : 'individual'
}

function mergeProducts(stored: Partial<ProductsPersistedState> | null): AdminProduct[] {
  const defaults = createSeedAdminProductsFromMock()
  if (
    !stored ||
    typeof stored !== 'object' ||
    !Array.isArray(stored.products) ||
    stored.products.length === 0
  )
    return defaults
  return stored.products as AdminProduct[]
}

export function hydrateAdminProductFromStorage(p: AdminProduct): AdminProduct {
  const currency =
    typeof p.currency === 'string' && p.currency.trim()
      ? p.currency.trim()
      : 'USD'
  const availability = (p.availability ?? []).map((row) => ({
    ...row,
    reservedQuantity: Math.max(0, row.reservedQuantity ?? 0),
  }))
  const base: AdminProduct = {
    ...p,
    dropIds: Array.isArray(p.dropIds) ? p.dropIds : [],
    currency,
    availability,
    sourceType: deriveSourceType(p.dropIds ?? []),
  }
  return rebuildAvailabilityMatrix(base)
}

export function prepareAdminProductForSave(p: AdminProduct): AdminProduct {
  return rebuildAvailabilityMatrix({
    ...p,
    currency: p.currency?.trim() ? p.currency.trim() : 'USD',
    sourceType: deriveSourceType(p.dropIds),
  })
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let s = base
  let n = 2
  while (taken.has(s)) {
    s = `${base}-${n}`
    n += 1
  }
  return s
}

export function duplicateAdminProduct(source: AdminProduct): AdminProduct {
  const all = getAdminProducts()
  const takenSlugs = new Set(all.map((x) => x.slug))
  const idMapColor = new Map<string, string>()
  const idMapSize = new Map<string, string>()
  for (const c of source.colors) idMapColor.set(c.id, createCmsId('color'))
  for (const s of source.sizes) idMapSize.set(s.id, createCmsId('size'))

  const colors = source.colors.map((c) => ({
    ...c,
    id: idMapColor.get(c.id)!,
    images: c.images.map((img) => ({
      ...img,
      id: createCmsId('img'),
    })),
  }))
  const sizes = source.sizes.map((s) => ({
    ...s,
    id: idMapSize.get(s.id)!,
  }))
  const availability = source.availability.map((row) => ({
    ...row,
    colorId: idMapColor.get(row.colorId) ?? row.colorId,
    sizeId: idMapSize.get(row.sizeId) ?? row.sizeId,
  }))

  const now = new Date().toISOString()
  const next: AdminProduct = {
    ...source,
    id: createCmsId('prod'),
    slug: uniqueSlug(`${source.slug}-copy`, takenSlugs),
    name: `${source.name} (copy)`,
    dropIds: [],
    colors,
    sizes,
    availability,
    createdAt: now,
    updatedAt: now,
  }
  return prepareAdminProductForSave(rebuildAvailabilityMatrix(next))
}

export function ensureProductsSeededWhenEmpty(): void {
  if (!isBrowser()) return
  const raw = readProductsRaw()
  if (raw) return
  const seed = createSeedAdminProductsFromMock()
  writeProductsRaw(JSON.stringify({ products: seed }))
}

export function getAdminProducts(): AdminProduct[] {
  const raw = readProductsRaw()
  if (!raw) return createSeedAdminProductsFromMock().map(hydrateAdminProductFromStorage)
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object')
      return createSeedAdminProductsFromMock().map(hydrateAdminProductFromStorage)
    return mergeProducts(parsed as Partial<ProductsPersistedState>).map(
      hydrateAdminProductFromStorage,
    )
  } catch {
    return createSeedAdminProductsFromMock().map(hydrateAdminProductFromStorage)
  }
}

export function getAdminProductBySlug(slug: string): AdminProduct | undefined {
  return getAdminProducts().find((p) => p.slug === slug)
}

export function getAdminProductById(id: string): AdminProduct | undefined {
  return getAdminProducts().find((p) => p.id === id)
}

export function saveAdminProducts(products: AdminProduct[]): ProductsPersistedState {
  const body: ProductsPersistedState = { products }
  writeProductsRaw(JSON.stringify(body))
  return body
}

export function upsertAdminProduct(product: AdminProduct): AdminProduct[] {
  const prepared = prepareAdminProductForSave({
    ...product,
    updatedAt: new Date().toISOString(),
  })
  const all = getAdminProducts()
  const idx = all.findIndex((p) => p.id === prepared.id)
  const next =
    idx === -1 ? [...all, prepared] : all.map((p, i) => (i === idx ? prepared : p))
  saveAdminProducts(next)
  return next
}

export function deleteAdminProduct(id: string): AdminProduct[] {
  const next = getAdminProducts().filter((p) => p.id !== id)
  saveAdminProducts(next)
  return next
}

export function replaceAdminProducts(next: AdminProduct[]): AdminProduct[] {
  saveAdminProducts(next)
  return next
}

export function createNewAdminProduct(): AdminProduct {
  return createEmptyAdminProduct()
}
