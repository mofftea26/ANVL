/**
 * Edge Function: forward operator JWT to PostgREST and run `cms_publish_drop`.
 *
 * ## TanStack `createServerFn` contract (suggested)
 *
 * ```ts
 * // server fn body (Node): forward session JWT from cookie/header
 * const res = await fetch(`${SUPABASE_URL}/functions/v1/publish-storefront`, {
 *   method: 'POST',
 *   headers: {
 *     Authorization: `Bearer ${userAccessToken}`,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({ dropId }),
 * })
 * const json: PublishStorefrontResponse = await res.json()
 * ```
 *
 * **Request body:** `{ dropId: string }` (UUID)
 * **Response:** `{ ok: true, revision: number, publishedAt: string, dropId: string }`
 * **Errors:** 401 missing auth, 400 bad body, 502 RPC error (see `error` field)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

type PublishBody = {
  dropId?: string
}

type RpcOk = {
  revision: number
  publishedAt: string
  dropId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization bearer token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: PublishBody
  try {
    body = (await req.json()) as PublishBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const dropId = body.dropId?.trim()
  if (!dropId) {
    return new Response(JSON.stringify({ error: 'dropId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ error: 'Function env misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await supabase.rpc('cms_publish_drop', {
    p_drop_id: dropId,
  })

  if (error) {
    const status = error.message?.includes('forbidden') ? 403 : 502
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const row = data as Record<string, unknown> | null
  if (!row || typeof row !== 'object') {
    return new Response(JSON.stringify({ error: 'Unexpected RPC payload' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload = row as unknown as RpcOk
  return new Response(
    JSON.stringify({
      ok: true,
      revision: Number(payload.revision),
      publishedAt: String(payload.publishedAt),
      dropId: String(payload.dropId),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
