import { useMemo, useSyncExternalStore } from 'react'
import { subscribeProductsChange } from '@/features/admin/products/products.storage'
import { getAdminProducts } from '@/features/admin/products/products.service'
import type { AdminProduct } from '@/features/admin/products/products.types'

/**
 * Cached snapshot — `getAdminProducts()` rebuilds arrays/objects each call; returning
 * that directly from `getSnapshot` violates React's stability requirement.
 */
let clientProductsSnapshot: AdminProduct[] | null = null

const SERVER_PRODUCTS_SNAPSHOT: AdminProduct[] = []

function refreshProductsSnapshot(): void {
  clientProductsSnapshot = getAdminProducts()
}

function getClientProductsSnapshot(): AdminProduct[] {
  if (clientProductsSnapshot === null) {
    refreshProductsSnapshot()
  }
  return clientProductsSnapshot!
}

function subscribeProducts(listener: () => void): () => void {
  return subscribeProductsChange(() => {
    refreshProductsSnapshot()
    listener()
  })
}

export function useAdminProductsList(): AdminProduct[] {
  return useSyncExternalStore(
    subscribeProducts,
    getClientProductsSnapshot,
    () => SERVER_PRODUCTS_SNAPSHOT,
  )
}

export function useAdminProductById(productId: string): AdminProduct | undefined {
  const products = useAdminProductsList()
  return useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  )
}
