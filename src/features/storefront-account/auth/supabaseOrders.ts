import type { Order, OrderItem, OrderStatus, StorefrontPaymentMethod, Address, OrderTotals } from '@/app/config/accountContracts'
import { getStorefrontSupabaseClient } from './storefrontSupabaseClient'

/**
 * Reads the customer's orders from the Supabase `orders` table, which the
 * `shopify-webhook` Edge Function populates from Shopify `orders/*` webhooks.
 * RLS scopes rows to the current user (by id or matching email). Returns an
 * empty list gracefully when Supabase is unconfigured or the table is absent.
 */

type OrdersRow = {
  shopify_order_id: string
  order_number: string | null
  customer_id: string | null
  email: string | null
  items: unknown
  totals: unknown
  status: string | null
  payment_method: string | null
  shipping_address: unknown
  created_at: string
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
]
const PAYMENT_METHODS: StorefrontPaymentMethod[] = ['cashOnDelivery', 'whishMoney', 'card']

function toStatus(raw: string | null): OrderStatus {
  return ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : 'pending'
}
function toPayment(raw: string | null): StorefrontPaymentMethod {
  return PAYMENT_METHODS.includes(raw as StorefrontPaymentMethod)
    ? (raw as StorefrontPaymentMethod)
    : 'cashOnDelivery'
}

function toItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>
    return {
      id: String(o.id ?? ''),
      title: String(o.title ?? ''),
      variantLabel: typeof o.variantLabel === 'string' ? o.variantLabel : undefined,
      quantity: Number(o.quantity ?? 0),
      unitPrice: Number(o.unitPrice ?? 0),
      lineTotal: Number(o.lineTotal ?? 0),
    }
  })
}

function toTotals(raw: unknown): OrderTotals {
  const o = (raw ?? {}) as Record<string, unknown>
  return {
    subtotal: Number(o.subtotal ?? 0),
    shipping: Number(o.shipping ?? 0),
    tax: Number(o.tax ?? 0),
    total: Number(o.total ?? 0),
    currency: String(o.currency ?? 'USD'),
  }
}

function toAddress(raw: unknown): Address {
  const o = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(o.id ?? 'ship'),
    name: typeof o.name === 'string' ? o.name : undefined,
    line1: String(o.line1 ?? ''),
    line2: typeof o.line2 === 'string' ? o.line2 : undefined,
    city: String(o.city ?? ''),
    country: String(o.country ?? ''),
    phone: typeof o.phone === 'string' ? o.phone : undefined,
  }
}

function rowToOrder(row: OrdersRow): Order {
  return {
    id: row.shopify_order_id,
    orderNumber: row.order_number ?? row.shopify_order_id,
    customerId: row.customer_id ?? undefined,
    items: toItems(row.items),
    totals: toTotals(row.totals),
    status: toStatus(row.status),
    paymentMethod: toPayment(row.payment_method),
    shippingAddress: toAddress(row.shipping_address),
    createdAt: row.created_at,
  }
}

const SELECT =
  'shopify_order_id, order_number, customer_id, email, items, totals, status, payment_method, shipping_address, created_at'

export async function listOrdersForCurrentUser(): Promise<Order[]> {
  const client = getStorefrontSupabaseClient()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('orders')
      .select(SELECT)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as OrdersRow[]).map(rowToOrder)
  } catch {
    return []
  }
}

export async function getOrderByIdForCurrentUser(id: string): Promise<Order | null> {
  const client = getStorefrontSupabaseClient()
  if (!client) return null
  try {
    const { data, error } = await client
      .from('orders')
      .select(SELECT)
      .eq('shopify_order_id', id)
      .maybeSingle()
    if (error || !data) return null
    return rowToOrder(data as OrdersRow)
  } catch {
    return null
  }
}
