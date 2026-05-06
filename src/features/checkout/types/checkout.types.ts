export interface CheckoutInput {
  email: string
  firstName: string
  lastName: string
  address1: string
  city: string
  country: string
  phone: string
  deliveryMethod: 'standard' | 'express'
  paymentMethod: 'cashOnDelivery' | 'tapPayments' | 'netCommerce'
}

export interface CheckoutOrderResult {
  orderId: string
  status: 'placed'
  total: number
}
