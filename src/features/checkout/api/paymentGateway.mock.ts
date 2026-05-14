import type { PaymentClient } from '@/app/config/clients'
import type { CartLine } from '@/features/cart/types/cart.types'
import {
  CHECKOUT_COMMERCE_FLAGS,
  isCheckoutPaymentMethodAllowedForCountry,
} from '../config/checkoutPayments.config'
import type { CheckoutInput } from '../types/checkout.types'
import type { PaymentGatewayAdapter, PaymentMethodId } from './paymentGateway.types'

const createMockResult = (lines: CartLine[]) => ({
  orderId: `ANVL-${Date.now()}`,
  status: 'placed' as const,
  total: lines.reduce((sum, item) => sum + item.price * item.quantity, 0),
})

const pause = () => new Promise((resolve) => setTimeout(resolve, 700))

const adapters: Record<PaymentMethodId, PaymentGatewayAdapter> = {
  cashOnDelivery: {
    id: 'cashOnDelivery',
    label: 'Cash on Delivery',
    async placeOrder(_input, lines) {
      await pause()
      return createMockResult(lines)
    },
  },
  whishMoney: {
    id: 'whishMoney',
    label: 'Whish Money',
    async placeOrder(_input, lines) {
      await pause()
      return createMockResult(lines)
    },
  },
  card: {
    id: 'card',
    label: 'Card',
    async placeOrder(_input, lines) {
      await pause()
      return createMockResult(lines)
    },
  },
}

export const paymentAdapters = Object.values(adapters)

function assertCheckoutRegionAllowsPayment(input: CheckoutInput): void {
  if (
    !isCheckoutPaymentMethodAllowedForCountry(
      input.country,
      input.paymentMethod,
      CHECKOUT_COMMERCE_FLAGS,
    )
  ) {
    throw new Error(
      '[mockPaymentClient] Payment method is not permitted for this shipping country and checkout flags.',
    )
  }
}

export const mockPaymentClient: PaymentClient = {
  async placeOrder(input: CheckoutInput, lines: CartLine[]) {
    assertCheckoutRegionAllowsPayment(input)
    const adapter = adapters[input.paymentMethod]
    return adapter.placeOrder(input, lines)
  },
}
