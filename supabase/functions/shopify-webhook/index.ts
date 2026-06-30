/**
 * Shopify Admin webhook receiver. Verifies HMAC, then mirrors `orders/*` events
 * into the Supabase `orders` table (service role) so the storefront account can
 * show order history. Non-order topics are acknowledged only.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic',
}

async function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!hmacHeader) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return digest === hmacHeader
}

type ShopifyOrder = Record<string, any>

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number.parseFloat(v) : typeof v === 'number' ? v : 0
  return Number.isFinite(n) ? n : 0
}

function mapStatus(o: ShopifyOrder): string {
  if (o.cancelled_at) return 'cancelled'
  if (o.fulfillment_status === 'fulfilled') return 'shipped'
  if (o.financial_status === 'paid') return 'confirmed'
  return 'pending'
}

function mapPaymentMethod(o: ShopifyOrder): string {
  const names: string[] = Array.isArray(o.payment_gateway_names) ? o.payment_gateway_names : []
  const joined = names.join(' ').toLowerCase()
  if (joined.includes('whish')) return 'whishMoney'
  if (joined.includes('cash') || joined.includes('cod') || joined.includes('delivery')) {
    return 'cashOnDelivery'
  }
  return 'card'
}

function mapItems(o: ShopifyOrder) {
  const lines: ShopifyOrder[] = Array.isArray(o.line_items) ? o.line_items : []
  return lines.map((l) => {
    const unitPrice = num(l.price)
    const quantity = num(l.quantity)
    return {
      id: String(l.id ?? l.variant_id ?? ''),
      title: String(l.title ?? l.name ?? ''),
      variantLabel: l.variant_title ?? undefined,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    }
  })
}

function mapTotals(o: ShopifyOrder) {
  const shippingSet = o.total_shipping_price_set?.shop_money?.amount
  return {
    subtotal: num(o.subtotal_price),
    shipping: num(shippingSet ?? o.total_shipping_price ?? 0),
    tax: num(o.total_tax),
    total: num(o.total_price),
    currency: String(o.currency ?? 'USD'),
  }
}

function mapAddress(o: ShopifyOrder) {
  const a = o.shipping_address ?? o.billing_address ?? {}
  return {
    id: 'ship',
    name: a.name ?? ([a.first_name, a.last_name].filter(Boolean).join(' ') || undefined),
    line1: String(a.address1 ?? ''),
    line2: a.address2 ?? undefined,
    city: String(a.city ?? ''),
    country: String(a.country ?? ''),
    phone: a.phone ?? undefined,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const secret = Deno.env.get('SHOPIFY_API_SECRET_KEY')
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const rawBody = await req.text()
  const hmac =
    req.headers.get('x-shopify-hmac-sha256') ?? req.headers.get('X-Shopify-Hmac-Sha256')
  if (!(await verifyShopifyHmac(rawBody, hmac, secret))) {
    return new Response(JSON.stringify({ error: 'Invalid HMAC' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const topic =
    req.headers.get('x-shopify-topic') ?? req.headers.get('X-Shopify-Topic') ?? 'unknown'

  // Mirror order events; ack everything else.
  if (topic.startsWith('orders/')) {
    try {
      const order = JSON.parse(rawBody) as ShopifyOrder
      const url = Deno.env.get('SUPABASE_URL')
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (url && serviceKey && order?.id != null) {
        const supabase = createClient(url, serviceKey)
        const email: string | null =
          order.email ?? order.contact_email ?? order.customer?.email ?? null

        // Link to a storefront user by email when one exists.
        let customerId: string | null = null
        if (email) {
          const { data: profile } = await supabase
            .from('storefront_profiles')
            .select('id')
            .ilike('email', email)
            .maybeSingle()
          customerId = (profile?.id as string | undefined) ?? null
        }

        await supabase.from('orders').upsert(
          {
            shopify_order_id: String(order.id),
            order_number: order.name ?? (order.order_number != null ? `#${order.order_number}` : null),
            customer_id: customerId,
            email,
            items: mapItems(order),
            totals: mapTotals(order),
            status: mapStatus(order),
            payment_method: mapPaymentMethod(order),
            shipping_address: mapAddress(order),
            raw: order,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'shopify_order_id' },
        )
      }
    } catch (_e) {
      // Never fail the webhook on a mirror error — Shopify would retry forever.
    }
  }

  return new Response(JSON.stringify({ ok: true, topic }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
