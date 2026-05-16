export type StorefrontPaymentMethod = 'cashOnDelivery' | 'whishMoney' | 'card'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Address {
  id: string
  label?: string
  name?: string
  line1: string
  line2?: string
  city: string
  country: string
  phone?: string
}

export interface OrderTotals {
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
}

export interface OrderItem {
  id: string
  title: string
  variantLabel?: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  customerId?: string
  items: OrderItem[]
  totals: OrderTotals
  status: OrderStatus
  paymentMethod: StorefrontPaymentMethod
  shippingAddress: Address
  createdAt: string
}

export interface Customer {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  addresses: Address[]
}

export interface CustomerProfileUpdate {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  addresses?: Address[]
}
