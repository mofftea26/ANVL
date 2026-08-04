import type { AccountClient } from '@/app/config/clients'
import type { Customer, Order } from '@/app/config/accountContracts'
import { getSessionCustomerId } from '@/app/config/accountSession'

/**
 * In-memory mock storefront account + orders.
 *
 * TODO(backend, medium): wire to real customer + order modules. Deliberate
 * placeholder, not an oversight — see the `AccountClient` note in
 * `src/app/config/clients.ts`. Real order history already flows into
 * `public.orders` via the `shopify-webhook` edge function, so this mock is the
 * remaining gap on the read side.
 */
export const DEMO_EMAIL = 'demo@anvl.lb'
export const DEMO_PASSWORD = 'demo1234'

const customers = new Map<string, Customer>()
const ordersByCustomer = new Map<string, Order[]>()

function seedDemo(): void {
  if (customers.has(DEMO_EMAIL)) return
  const id = 'cust-demo-01'
  const customer: Customer = {
    id,
    email: DEMO_EMAIL,
    firstName: 'Demo',
    lastName: 'Lifter',
    phone: '+961 1 234 567',
    addresses: [
      {
        id: 'addr-1',
        label: 'Home',
        name: 'Demo Lifter',
        line1: 'Hamra Street',
        city: 'Beirut',
        country: 'Lebanon',
      },
    ],
  }
  customers.set(DEMO_EMAIL.toLowerCase(), customer)

  const o1: Order = {
    id: 'ord-1001',
    orderNumber: 'ANVL-1001',
    createdAt: new Date().toISOString(),
    status: 'delivered',
    paymentMethod: 'cashOnDelivery',
    shippingAddress: customer.addresses[0]!,
    items: [
      {
        id: 'li-1',
        title: 'Compression Tee',
        variantLabel: 'M · Black',
        quantity: 1,
        unitPrice: 45,
        lineTotal: 45,
      },
    ],
    totals: {
      subtotal: 45,
      shipping: 5,
      tax: 0,
      total: 50,
      currency: 'USD',
    },
  }
  ordersByCustomer.set(id, [o1])
}

seedDemo()

function customerById(id: string): Customer | undefined {
  for (const c of customers.values()) {
    if (c.id === id) return c
  }
  return undefined
}

export function mockAccountSignIn(email: string, password: string): Customer {
  seedDemo()
  const c = customers.get(email.trim().toLowerCase())
  if (!c || password !== DEMO_PASSWORD) {
    throw new Error('INVALID_CREDENTIALS')
  }
  return c
}

export function mockAccountSignUp(input: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Customer {
  seedDemo()
  const key = input.email.trim().toLowerCase()
  if (customers.has(key)) {
    throw new Error('STOREFRONT_ACCOUNT_EMAIL_TAKEN')
  }
  const id = `cust-${Math.random().toString(36).slice(2, 10)}`
  const customer: Customer = {
    id,
    email: key,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    addresses: [
      {
        id: 'addr-primary-new',
        line1: '',
        city: '',
        country: 'Lebanon',
      },
    ],
  }
  customers.set(key, customer)
  ordersByCustomer.set(id, [])
  return customer
}

export function mockAccountForgotPassword(_email: string): void {
  /* demo — no outbound email */
}

export const mockAccountClient: AccountClient = {
  async getCustomerProfile() {
    const id = getSessionCustomerId()
    if (!id) throw new Error('UNAUTHORIZED')
    const c = customerById(id)
    if (!c) throw new Error('UNAUTHORIZED')
    return { ...c, addresses: c.addresses.map((a) => ({ ...a })) }
  },
  async updateCustomerProfile(input) {
    const id = getSessionCustomerId()
    if (!id) throw new Error('UNAUTHORIZED')
    const existing = customerById(id)
    if (!existing) throw new Error('UNAUTHORIZED')
    const emailKey = existing.email.toLowerCase()
    const next: Customer = {
      ...existing,
      firstName: input.firstName ?? existing.firstName,
      lastName: input.lastName ?? existing.lastName,
      phone: input.phone ?? existing.phone,
      addresses: input.addresses ?? existing.addresses,
    }
    customers.set(emailKey, next)
    return next
  },
  async listOrders() {
    const id = getSessionCustomerId()
    if (!id) return []
    return [...(ordersByCustomer.get(id) ?? [])]
  },
  async getOrderById(orderId: string) {
    const id = getSessionCustomerId()
    if (!id) return null
    return (ordersByCustomer.get(id) ?? []).find((o) => o.id === orderId) ?? null
  },
}
