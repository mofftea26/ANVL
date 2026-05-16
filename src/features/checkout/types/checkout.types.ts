import type { CheckoutPaymentMethodId } from '../config/checkoutPayments.config'

export interface CheckoutInput {
  email: string
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  postalCode?: string
  country: string
  phone: string
  deliveryNotes?: string
  deliveryMethod: 'standard' | 'express'
  paymentMethod: CheckoutPaymentMethodId
}

export interface CheckoutOrderResult {
  orderId: string
  status: 'placed'
  total: number
}
