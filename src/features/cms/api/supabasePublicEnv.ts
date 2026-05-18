export type SupabasePublicEnv = {
  url: string
  anonKey: string
}

/**
 * Supabase URL + anon (publishable) key for browser and SSR loaders.
 * Never use the service role key here — it must not be bundled under `VITE_*`.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  )?.trim()
  if (!url || !anonKey) return null
  return { url, anonKey }
}
