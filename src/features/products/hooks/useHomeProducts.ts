import { useSyncExternalStore } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { subscribeProductsChange } from '@/features/admin/products/products.storage'
import { getStorefrontProductsForHome } from '@/features/admin/products/products.commerce'

let snapshot: Product[] | null = null

function readSnapshot(): Product[] {
  if (snapshot === null) snapshot = getStorefrontProductsForHome()
  return snapshot
}

function subscribe(listener: () => void): () => void {
  return subscribeProductsChange(() => {
    snapshot = null
    listener()
  })
}

/** Keeps homepage hero/drop sections aligned with admin product assignments. */
export function useHomeProducts(initial: Product[]): Product[] {
  return useSyncExternalStore(
    subscribe,
    () => readSnapshot(),
    () => initial,
  )
}
