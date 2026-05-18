/**
 * Stub for future Medusa → ANVL sync (inventory/price). Validates shared secret only.
 *
 * Set secret in Edge Function env: `ANVL_MEDUSA_WEBHOOK_SECRET`
 *
 * **Request:** POST with header `x-anvl-medusa-secret: <secret>`
 * **Response:** `{ ok: true, stub: true }`
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-anvl-medusa-secret',
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

  const secret = Deno.env.get('ANVL_MEDUSA_WEBHOOK_SECRET')
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const provided = req.headers.get('x-anvl-medusa-secret')
  if (provided !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, stub: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
