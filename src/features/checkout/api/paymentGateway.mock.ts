import type { PaymentClient } from '@/app/config/clients'
import type { CartLine } from '@/features/cart/types/cart.types'
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
  tapPayments: {
    id: 'tapPayments',
    label: 'Tap Payments (placeholder)',
    async placeOrder(_input, lines) {
      await pause()
      return createMockResult(lines)
    },
  },
  netCommerce: {
    id: 'netCommerce',
    label: 'NetCommerce (placeholder)',
    async placeOrder(_input, lines) {
      await pause()
      return createMockResult(lines)
    },
  },
}

export const paymentAdapters = Object.values(adapters)

export const mockPaymentClient: PaymentClient = {
  async placeOrder(input: CheckoutInput, lines: CartLine[]) {
    const adapter = adapters[input.paymentMethod]
    return adapter.placeOrder(input, lines)
  },
}
