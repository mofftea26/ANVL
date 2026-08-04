import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'

/**
 * Is the internal `/checkout` flow allowed to run?
 *
 * `/checkout` is backed by `paymentGateway.mock.ts`, whose `placeOrder` ALWAYS
 * resolves `{ status: 'placed', orderId: 'ANVL-<timestamp>' }` without ever
 * contacting a payment processor and without writing an order anywhere. It
 * exists so the seed / localStorage catalogue has a checkout to exercise in
 * development — it is NOT a payment path.
 *
 * Two conditions must BOTH hold for it to be reachable:
 *
 *  1. Shopify is not configured. When `VITE_SHOPIFY_*` are set, Shopify's
 *     hosted checkout is the real (and only) way to take money, so a fall back
 *     into the mock would hand a real buyer a fabricated order confirmation —
 *     either after a transient Storefront API failure, or simply by typing
 *     `/checkout` into the address bar.
 *  2. This is a development build. A production bundle must never be able to
 *     reach the mock gateway, whatever the env happens to contain.
 *
 * Callers: the `/checkout` route guard, and the two cart checkout handlers
 * (`routes/cart.tsx`, `features/cart/components/CartDrawer.tsx`), which use it
 * to decide between "fall back to the internal flow" and "surface the error".
 */
export function isInternalCheckoutEnabled(): boolean {
  if (getShopifyPublicEnv()) return false
  return import.meta.env.DEV
}
