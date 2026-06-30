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

/** Body measurements (cm / kg) — power future PDP size suggestions. */
export interface Measurements {
  heightCm?: number
  weightKg?: number
  chestCm?: number
  waistCm?: number
  hipsCm?: number
  shoulderCm?: number
  inseamCm?: number
}

export type Gender = '' | 'male' | 'female' | 'other' | 'preferNotToSay'

export interface Customer {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  addresses: Address[]
  /** Notification preferences (persisted on the profile row). */
  marketingOptIn?: boolean
  orderUpdatesOptIn?: boolean
  /** Richer personal profile. */
  birthdate?: string
  gender?: Gender
  preferredSize?: string
  measurements?: Measurements
  avatarUrl?: string
}

export interface CustomerProfileUpdate {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  addresses?: Address[]
  marketingOptIn?: boolean
  orderUpdatesOptIn?: boolean
  birthdate?: string | null
  gender?: Gender
  preferredSize?: string
  measurements?: Measurements
}
