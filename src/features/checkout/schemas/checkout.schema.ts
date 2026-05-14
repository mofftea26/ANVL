import { z } from 'zod'
import {
  CHECKOUT_COMMERCE_FLAGS,
  getCheckoutPaymentMethodIds,
  isLebanonShippingCountry,
  type CheckoutPaymentMethodId,
} from '../config/checkoutPayments.config'

const paymentMethodEnum = z.enum(['cashOnDelivery', 'whishMoney', 'card'])

export function createCheckoutSchema(flags: { internationalCheckoutEnabled: boolean } = CHECKOUT_COMMERCE_FLAGS) {
  return z
    .object({
      email: z.string().trim().email('Enter a valid email address'),
      firstName: z.string().trim().min(2, 'First name is required'),
      lastName: z.string().trim().min(2, 'Last name is required'),
      address1: z.string().trim().min(4, 'Street address is required'),
      address2: z.string().trim().max(120, 'Address line 2 is too long').optional(),
      city: z.string().trim().min(2, 'City is required'),
      postalCode: z.string().trim().max(20, 'Postal code is too long').optional(),
      country: z.string().trim().min(2, 'Country is required'),
      phone: z
        .string()
        .trim()
        .min(7, 'Phone is required')
        .regex(/^[+0-9][\d\s().-]{6,}$/i, 'Enter a valid phone number'),
      deliveryNotes: z.string().trim().max(500, 'Delivery notes are too long').optional(),
      deliveryMethod: z.enum(['standard', 'express']),
      paymentMethod: paymentMethodEnum,
    })
    .superRefine((data, ctx) => {
      const allowed = getCheckoutPaymentMethodIds(data.country, flags)

      if (!isLebanonShippingCountry(data.country) && !flags.internationalCheckoutEnabled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'International checkout is not enabled yet. Please ship to Lebanon or contact support for other regions.',
          path: ['country'],
        })
      }

      if (allowed.length === 0) {
        return
      }

      if (!allowed.includes(data.paymentMethod as CheckoutPaymentMethodId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a payment method that is available for your shipping country.',
          path: ['paymentMethod'],
        })
      }
    })
}

export const checkoutSchema = createCheckoutSchema(CHECKOUT_COMMERCE_FLAGS)

export type CheckoutSchemaInput = z.infer<typeof checkoutSchema>
