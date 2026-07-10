import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'

export type ComingSoonSubscriber = {
  id: string
  email: string
  source: string
  createdAt: string
}

export type ComingSoonSubscribersResult =
  | { ok: true; subscribers: ComingSoonSubscriber[] }
  | { ok: false; error: string }

/**
 * Read the early-access list. RLS restricts SELECT on
 * `coming_soon_subscribers` to `cms_profiles.role = 'admin'` — exactly who
 * can reach this editor — so the admin browser client reads it directly.
 */
export async function fetchComingSoonSubscribers(): Promise<ComingSoonSubscribersResult> {
  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Sign in to view subscribers.' }
  }
  const { data, error } = await client
    .from('coming_soon_subscribers')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) return { ok: false, error: error.message }

  const subscribers: ComingSoonSubscriber[] = []
  for (const row of data ?? []) {
    if (typeof row.id !== 'string' || typeof row.email !== 'string') continue
    subscribers.push({
      id: row.id,
      email: row.email,
      source: typeof row.source === 'string' ? row.source : '',
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    })
  }
  return { ok: true, subscribers }
}

/** Serialize the list to a spreadsheet-safe CSV string. */
export function subscribersToCsv(subscribers: ComingSoonSubscriber[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const lines = ['email,source,subscribed_at']
  for (const s of subscribers) {
    lines.push([escape(s.email), escape(s.source), escape(s.createdAt)].join(','))
  }
  return lines.join('\r\n')
}
