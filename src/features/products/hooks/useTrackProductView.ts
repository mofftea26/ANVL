import { useEffect } from 'react'
import { useProductAnalytics } from '@/features/analytics/hooks/useProductAnalytics'
import type { Product } from '../types/product.types'

export function useTrackProductView(product: Product) {
  const { trackProductView } = useProductAnalytics()

  useEffect(() => {
    trackProductView(product)
  }, [product, trackProductView])
}
