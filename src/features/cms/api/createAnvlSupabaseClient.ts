import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

type CreateClientOptions = NonNullable<Parameters<typeof createClient>[2]>

/**
 * Creates a Supabase client with an explicit `apikey` header on every request.
 * Guards against missing-key errors when env is misread or the singleton was
 * created before Vite injected `VITE_SUPABASE_*` at dev startup.
 */
export function createAnvlSupabaseClient(
  env: SupabasePublicEnv,
  options?: CreateClientOptions,
): SupabaseClient {
  const { global: globalOpts, ...rest } = options ?? {}
  return createClient(env.url, env.anonKey, {
    ...rest,
    global: {
      ...globalOpts,
      headers: {
        apikey: env.anonKey,
        ...globalOpts?.headers,
      },
    },
  }) as SupabaseClient
}
