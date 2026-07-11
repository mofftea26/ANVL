import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { createAnvlSupabaseClient } from '@/features/cms/api/createAnvlSupabaseClient'

/**
 * Shared anon Supabase client for storefront reads that still use the full
 * `@supabase/supabase-js` client (currently the Story saga). The published
 * projection and coming-soon signup deliberately use plain `fetch`
 * (`supabaseRest.ts`) instead, so this module — and supabase-js — stays out of
 * their bundles. Kept as a singleton per env so repeat calls reuse one client.
 */
export const SUPABASE_PUBLICATION_ANON_AUTH_STORAGE_KEY =
  'anvl.supabase.storefront-public.v1'

const publicationAnonClients = new Map<string, SupabaseClient>()

export function getSupabasePublicationAnonClient(
  env: SupabasePublicEnv,
): SupabaseClient {
  const key = `${env.url}#${env.anonKey}`
  let client = publicationAnonClients.get(key)
  if (!client) {
    client = createAnvlSupabaseClient(env, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: SUPABASE_PUBLICATION_ANON_AUTH_STORAGE_KEY,
      },
    })
    publicationAnonClients.set(key, client)
  }
  return client
}
