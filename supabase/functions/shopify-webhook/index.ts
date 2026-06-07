/**
 * Shopify Admin webhook receiver (products/inventory). Verifies HMAC and acknowledges.
 */
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
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(rawBody),
  )
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return digest === hmacHeader
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
  const hmac = req.headers.get('x-shopify-hmac-sha256')
    ?? req.headers.get('X-Shopify-Hmac-Sha256')

  const valid = await verifyShopifyHmac(rawBody, hmac, secret)
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid HMAC' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const topic =
    req.headers.get('x-shopify-topic') ?? req.headers.get('X-Shopify-Topic') ?? 'unknown'

  return new Response(JSON.stringify({ ok: true, topic }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
