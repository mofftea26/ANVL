import type { AdminProduct } from './products.types'
import {
  createEmptyAdminProduct,
  createSeedAdminProductsFromMock,
} from './products.defaults'
import {
  readProductsRaw,
  writeProductsRaw,
  isBrowser,
} from './products.storage'

export type ProductsPersistedState = {
  products: AdminProduct[]
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

export function ensureProductsSeededWhenEmpty(): void {
  if (!isBrowser()) return
  const raw = readProductsRaw()
  if (raw) return
  const seed = createSeedAdminProductsFromMock()
  writeProductsRaw(JSON.stringify({ products: seed }))
}

export function getAdminProducts(): AdminProduct[] {
  const raw = readProductsRaw()
  if (!raw) return createSeedAdminProductsFromMock()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object')
      return createSeedAdminProductsFromMock()
    return mergeProducts(parsed as Partial<ProductsPersistedState>)
  } catch {
    return createSeedAdminProductsFromMock()
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
  const all = getAdminProducts()
  const idx = all.findIndex((p) => p.id === product.id)
  const next =
    idx === -1 ? [...all, product] : all.map((p, i) => (i === idx ? product : p))
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
