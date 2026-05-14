import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  CHECKOUT_COMMERCE_FLAGS,
  getCheckoutPaymentMethodDefinitions,
} from '../config/checkoutPayments.config'
import type { CheckoutSchemaInput } from '../schemas/checkout.schema'

/**
 * Keeps `paymentMethod` aligned with the typed catalog when the shipping country changes.
 */
export function useSyncCheckoutPaymentWithCountry(
  form: UseFormReturn<CheckoutSchemaInput>,
  country: string,
) {
  useEffect(() => {
    const defs = getCheckoutPaymentMethodDefinitions(country, CHECKOUT_COMMERCE_FLAGS)
    const allowedIds = defs.map((d) => d.id)
    const current = form.getValues('paymentMethod')
    if (allowedIds.length > 0 && !allowedIds.includes(current)) {
      form.setValue('paymentMethod', allowedIds[0]!, { shouldValidate: true, shouldDirty: true })
    }
  }, [country, form])
}
