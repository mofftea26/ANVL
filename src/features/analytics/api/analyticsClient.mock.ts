import type { AnalyticsClient } from '@/app/config/clients'

const log = (event: string, payload: unknown) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${event}`, payload)
  }
}

export const mockAnalyticsClient: AnalyticsClient = {
  trackPageView(payload) {
    log('page_view', payload)
  },
  trackProductView(payload) {
    log('product_view', payload)
  },
  trackAddToCart(payload) {
    log('add_to_cart', payload)
  },
  trackBeginCheckout(payload) {
    log('begin_checkout', payload)
  },
  trackOrderPlaced(payload) {
    log('order_placed', payload)
  },
  trackWaitlistSignup(payload) {
    log('waitlist_signup', payload)
  },
}
