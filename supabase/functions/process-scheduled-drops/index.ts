/**
 * Cron-safe worker: promotes scheduled drops via `cms_process_scheduled_drops`.
 *
 * Invoke every 1–5 minutes from Supabase Dashboard → Edge Functions → Schedules,
 * or an external cron hitting:
 *   POST /functions/v1/process-scheduled-drops
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Requires Edge secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function unauthorized(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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

  const cronSecret = Deno.env.get('CRON_SECRET')?.trim()
  const authHeader = req.headers.get('Authorization')?.trim()
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return unauthorized('Invalid cron authorization')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Function env misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.rpc('cms_process_scheduled_drops')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, result: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
