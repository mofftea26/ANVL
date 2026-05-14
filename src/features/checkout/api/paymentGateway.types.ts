import type { CartLine } from '@/features/cart/types/cart.types'
import type { CheckoutPaymentMethodId } from '../config/checkoutPayments.config'
import type { CheckoutInput, CheckoutOrderResult } from '../types/checkout.types'

export type PaymentMethodId = CheckoutPaymentMethodId

export interface PaymentGatewayAdapter {
  id: PaymentMethodId
  label: string
  placeOrder(input: CheckoutInput, lines: CartLine[]): Promise<CheckoutOrderResult>
}
