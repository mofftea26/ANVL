import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

let singleton: SupabaseClient | null = null

/**
 * Browser-only Supabase client with its own auth storage key so anon SSR reads
 * never collide with the admin session.
 */
export function getAdminSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  const env = getSupabasePublicEnv()
  if (!env) return null
  if (!singleton) {
    singleton = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'anvl.supabase.admin.v1',
      },
    })
  }
  return singleton
}

export function disposeAdminSupabaseBrowserClient(): void {
  singleton = null
}
