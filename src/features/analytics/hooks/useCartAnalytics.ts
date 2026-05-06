import { useCallback } from 'react'
import { runtimeClients } from '@/app/config/runtime'

export function useCartAnalytics() {
  return {
    trackBeginCheckout: useCallback(
      (lineCount: number, subtotal: number) =>
        runtimeClients.analytics.trackBeginCheckout({ lineCount, subtotal }),
      [],
    ),
    trackOrderPlaced: useCallback(
      (orderId: string, total: number) =>
        runtimeClients.analytics.trackOrderPlaced({ orderId, total }),
      [],
    ),
    trackWaitlist: useCallback(
      (email: string, preferredProduct?: string) =>
        runtimeClients.analytics.trackWaitlistSignup({ email, preferredProduct }),
      [],
    ),
  }
}
