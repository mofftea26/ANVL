import type { User } from '@supabase/supabase-js'

function pickMetaString(
  meta: Record<string, unknown> | null | undefined,
  keys: string[],
): string | undefined {
  if (!meta) return undefined
  for (const k of keys) {
    const v = meta[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

/**
 * Label for the admin chrome (top bar). Uses Auth `user_metadata` when set
 * (Supabase Dashboard → Authentication → Users → display name / raw user
 * metadata keys like `full_name`), otherwise email local-part.
 */
export function supabaseUserDisplayLabel(
  user: Pick<User, 'email' | 'user_metadata'>,
): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const fromMeta = pickMetaString(meta, [
    'full_name',
    'name',
    'display_name',
    'displayName',
    'user_name',
    'preferred_username',
  ])
  if (fromMeta) return fromMeta
  const email = user.email?.trim() ?? ''
  const at = email.indexOf('@')
  if (at > 0) return email.slice(0, at)
  return email || 'Admin'
}
