import { useCallback } from 'react'
import { runtimeClients } from '@/app/config/runtime'
import type { Product } from '@/features/products/types/product.types'

export function useProductAnalytics() {
  return {
    trackProductView: useCallback((product: Product) =>
      runtimeClients.analytics.trackProductView({
        slug: product.slug,
        name: product.name,
      }), []),
    trackAddToCart: useCallback((product: Product, quantity: number) =>
      runtimeClients.analytics.trackAddToCart({
        productId: product.id,
        quantity,
        price: product.price,
      }), []),
  }
}
