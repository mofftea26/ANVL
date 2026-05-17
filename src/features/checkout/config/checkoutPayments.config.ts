/**
 * Checkout region + payment method catalog (single source of truth).
 *
 * Integration points (no live PSP wiring yet):
 * - `cashOnDelivery` — fulfilled manually / driver COD reconciliation.
 * - `whishMoney` — wallet reference + manual confirmation until Whish API exists.
 * - `card` — reserved for Medusa / Stripe (or similar) when international checkout ships.
 *
 * Toggle international card checkout via `VITE_ANVL_INTERNATIONAL_CHECKOUT=true` at build time.
 */

import { publicEnv } from '@/app/config/publicEnv'

export const LEBANON_COUNTRY_LABEL = 'Lebanon' as const

export type CheckoutPaymentMethodId = 'cashOnDelivery' | 'whishMoney' | 'card'

export type CheckoutPaymentIntegrationPoint = 'cod_manual' | 'whish_wallet' | 'psp_card'

export interface CheckoutPaymentMethodDefinition {
  id: CheckoutPaymentMethodId
  label: string
  description: string
  integrationPoint: CheckoutPaymentIntegrationPoint
}

const LEBANON_METHODS: readonly CheckoutPaymentMethodDefinition[] = [
  {
    id: 'cashOnDelivery',
    label: 'Cash on Delivery',
    description: 'Pay the courier in cash when your order arrives in Lebanon.',
    integrationPoint: 'cod_manual',
  },
  {
    id: 'whishMoney',
    label: 'Whish Money',
    description: 'You will receive Whish payment details after you place the order.',
    integrationPoint: 'whish_wallet',
  },
]

const INTERNATIONAL_CARD_ONLY: readonly CheckoutPaymentMethodDefinition[] = [
  {
    id: 'card',
    label: 'Card',
    description: 'Card payment (Visa/Mastercard) — processor integration pending.',
    integrationPoint: 'psp_card',
  },
]

/** Evaluated once per bundle load; stable for SSR + client. */
export const CHECKOUT_COMMERCE_FLAGS = {
  internationalCheckoutEnabled:
    publicEnv.VITE_ANVL_INTERNATIONAL_CHECKOUT === 'true',
} as const

/** Storefront shipping country labels (expand when logistics supports more lanes). */
export const CHECKOUT_SHIPPING_COUNTRIES = [
  LEBANON_COUNTRY_LABEL,
  'United Arab Emirates',
  'Saudi Arabia',
  'France',
  'Germany',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
] as const

export type CheckoutShippingCountry = (typeof CHECKOUT_SHIPPING_COUNTRIES)[number]

export function isLebanonShippingCountry(country: string): boolean {
  const n = country.trim().toLowerCase()
  return n === LEBANON_COUNTRY_LABEL.toLowerCase() || n === 'lb'
}

export function getCheckoutPaymentMethodDefinitions(
  country: string,
  flags: { internationalCheckoutEnabled: boolean } = CHECKOUT_COMMERCE_FLAGS,
): readonly CheckoutPaymentMethodDefinition[] {
  if (isLebanonShippingCountry(country)) {
    return LEBANON_METHODS
  }
  if (flags.internationalCheckoutEnabled) {
    return INTERNATIONAL_CARD_ONLY
  }
  return []
}

export function getCheckoutPaymentMethodIds(
  country: string,
  flags: { internationalCheckoutEnabled: boolean } = CHECKOUT_COMMERCE_FLAGS,
): CheckoutPaymentMethodId[] {
  return getCheckoutPaymentMethodDefinitions(country, flags).map((d) => d.id)
}

export function isCheckoutPaymentMethodAllowedForCountry(
  country: string,
  paymentMethod: CheckoutPaymentMethodId,
  flags: { internationalCheckoutEnabled: boolean } = CHECKOUT_COMMERCE_FLAGS,
): boolean {
  return getCheckoutPaymentMethodIds(country, flags).includes(paymentMethod)
}
