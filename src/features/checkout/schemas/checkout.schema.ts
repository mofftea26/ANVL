import { z } from 'zod'

export const checkoutSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  address1: z.string().min(4, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(7, 'Phone is required'),
  deliveryMethod: z.enum(['standard', 'express']),
  paymentMethod: z.enum(['cashOnDelivery', 'tapPayments', 'netCommerce']),
})

export type CheckoutSchemaInput = z.infer<typeof checkoutSchema>
