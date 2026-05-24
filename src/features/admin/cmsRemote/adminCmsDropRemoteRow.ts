import type { Drop } from '@/features/admin/drops/drops.types'

/** PostgREST row shape for `public.anvl_drops` upserts/inserts. */
export function buildAnvlDropRemoteRow(drop: Drop) {
  return {
    slug: drop.slug,
    status: drop.status,
    draft_body: JSON.parse(JSON.stringify(drop)) as Record<string, unknown>,
    client_drop_id: drop.id,
    release_date: drop.releaseDate ?? null,
    scheduled_activation_at: drop.scheduledActivationAt ?? null,
  }
}
