import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { restInsert } from '@/features/cms/api/supabaseRest'

/** Postgres unique-violation — the email is already on the list. */
const UNIQUE_VIOLATION = '23505'

export type SubscribeComingSoonResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string }

/**
 * Add an email to `coming_soon_subscribers` via the anon client (the table is
 * a write-only mailbox: INSERT-only RLS for anon, so the list can never be
 * read from the storefront). A duplicate signup is reported as success —
 * the visitor's goal ("be on the list") is met either way.
 *
 * Without Supabase configured (local dev/seed mode) this is a validated no-op
 * that still resolves ok, clearly marked so the UI stays exercisable.
 */
export async function subscribeComingSoon(
  email: string,
  source = 'coming-soon',
): Promise<SubscribeComingSoonResult> {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const env = getSupabasePublicEnv()
  if (!env) {
    // Mock path: no backend configured — accept so the form flow is testable.
    return { ok: true, alreadySubscribed: false }
  }

  try {
    const { error } = await restInsert(env, 'coming_soon_subscribers', {
      email: normalized,
      source,
      metadata: { drop: 'drop-01-the-oath' },
    })
    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return { ok: true, alreadySubscribed: true }
      }
      return { ok: false, error: 'Could not save your email. Please try again.' }
    }
    return { ok: true, alreadySubscribed: false }
  } catch {
    return { ok: false, error: 'Could not save your email. Please try again.' }
  }
}
