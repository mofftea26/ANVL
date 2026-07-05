import type { SupabaseClient } from '@supabase/supabase-js'
import { createAnvlSupabaseClient } from '@/features/cms/api/createAnvlSupabaseClient'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

/**
 * Fresh, request-scoped Supabase client for admin auth server functions.
 * Anon/publishable key only — never the service role key — so the
 * `cms_profiles` role check still goes through RLS with the signed-in user's
 * own JWT. No session persistence: each server invocation creates its own
 * short-lived client, nothing to persist to on the server.
 */
export function createAdminServerSupabaseClient(): SupabaseClient | null {
  const env = getSupabasePublicEnv()
  if (!env) return null
  return createAnvlSupabaseClient(env, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
