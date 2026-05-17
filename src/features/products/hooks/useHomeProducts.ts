import { useSyncExternalStore } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { subscribeProductsChange } from '@/features/products/catalog/productSubscriptions'
import { getStorefrontProductsForHome } from '@/features/products/catalog/storefrontCatalog'

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
