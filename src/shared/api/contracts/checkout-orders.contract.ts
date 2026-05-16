/**
 * Checkout completion + order history contracts.
 *
 * Medusa split: **Medusa** — cart, payments, fulfillments, inventory.
 */

import type { CartLine } from '@/features/cart/types/cart.types'
import type { CheckoutInput, CheckoutOrderResult } from '@/features/checkout/types/checkout.types'
import type { OffsetPaginatedResult, OffsetPaginationQuery } from './common.types'

export const CHECKOUT_API_PREFIX = '/api/checkout' as const
export const ORDERS_API_PREFIX = '/api/orders' as const

export type CheckoutLineItemBody = Pick<CartLine, 'productId' | 'quantity'> & {
  variantKey?: string
}

export type CheckoutPlaceOrderBody = CheckoutInput & {
  lines: CheckoutLineItemBody[]
  idempotencyKey?: string
}

export type CheckoutPlaceOrderResponse = CheckoutOrderResult & {
  orderNumber?: string
}

export type OrderPaymentMethod = CheckoutInput['paymentMethod']

export type OrderListItem = {
  id: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  currency: string
  itemCount: number
}

export type OrderListQuery = OffsetPaginationQuery & {
  status?: OrderListItem['status'] | 'all'
}

export type OrderListResponse = OffsetPaginatedResult<OrderListItem>

export type OrderLineItemResponse = {
  id: string
  title: string
  quantity: number
  unitPrice: number
  thumbnailUrl?: string
  variantLabel?: string
}

export type OrderShippingAddressSnapshot = Pick<
  CheckoutInput,
  'email' | 'firstName' | 'lastName' | 'address1' | 'city' | 'country' | 'phone'
>

export type OrderDetailResponse = {
  id: string
  orderNumber: string
  customerId?: string
  email: string
  status: OrderListItem['status']
  paymentMethod: OrderPaymentMethod
  items: OrderLineItemResponse[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
  shippingAddress: OrderShippingAddressSnapshot
  createdAt: string
}
