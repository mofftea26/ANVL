export type SupabasePublicEnv = {
  url: string
  /** Browser-safe Supabase key (`sb_publishable_…` or legacy anon JWT). */
  anonKey: string
}

/** True when `VITE_SUPABASE_URL` is set — app targets Supabase auth/CMS even if the key is missing. */
export function isSupabaseAuthTarget(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL?.trim())
}

/** Rejects `.env.example` placeholders and empty keys before hitting the Supabase API. */
export function isUsableSupabasePublicKey(key: string): boolean {
  const trimmed = key.trim()
  if (trimmed.length < 20) return false
  if (trimmed.includes('...')) return false
  if (/^your[-_]/i.test(trimmed)) return false
  if (/^paste/i.test(trimmed)) return false
  if (/^<.+>$/.test(trimmed)) return false
  return true
}

/**
 * Actionable copy when URL is set but the publishable/anon key is missing or invalid.
 * Shown on admin login instead of a cryptic Supabase 401 JSON.
 */
export function getSupabaseEnvIssue(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  if (!url) return null

  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  const anonKey = publishableKey || legacyAnonKey

  if (!anonKey) {
    return (
      'VITE_SUPABASE_URL is set but no API key was found. Add VITE_SUPABASE_PUBLISHABLE_KEY ' +
      '(Supabase Dashboard → Project Settings → API Keys → Publishable key) or legacy ' +
      'VITE_SUPABASE_ANON_KEY to your .env, then restart the dev server (pnpm dev).'
    )
  }

  if (!isUsableSupabasePublicKey(anonKey)) {
    return (
      'VITE_SUPABASE_PUBLISHABLE_KEY looks like a placeholder or is too short. Paste the full ' +
      'publishable key from Supabase Dashboard → API Keys (or set VITE_SUPABASE_ANON_KEY to the ' +
      'legacy anon JWT), then restart the dev server.'
    )
  }

  return null
}

/**
 * Supabase URL + publishable (or legacy anon) key for browser and SSR loaders.
 * Prefer `VITE_SUPABASE_PUBLISHABLE_KEY` — matches Supabase Dashboard naming.
 * Never use the service role key here; it must not be bundled under `VITE_*`.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  const anonKey = publishableKey || legacyAnonKey
  if (!url || !anonKey || !isUsableSupabasePublicKey(anonKey)) return null
  return { url, anonKey }
}
