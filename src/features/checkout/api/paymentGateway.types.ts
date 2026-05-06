import type { CartLine } from '@/features/cart/types/cart.types'
import type { CheckoutInput, CheckoutOrderResult } from '../types/checkout.types'

export type PaymentMethodId = 'cashOnDelivery' | 'tapPayments' | 'netCommerce'

export interface PaymentGatewayAdapter {
  id: PaymentMethodId
  label: string
  placeOrder(input: CheckoutInput, lines: CartLine[]): Promise<CheckoutOrderResult>
}
