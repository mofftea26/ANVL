import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import type { DropStatus } from '@/features/drops/drop.types'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { persistedDropSchema } from '@/features/admin/drops/drops.persistence.zod'

type AnvlDropListRow = {
  id: string
  slug: string
  status: string
  client_drop_id?: string | null
  release_date?: string | null
  scheduled_activation_at?: string | null
  updated_at?: string | null
  draft_body: unknown
}

function resolveClientDropId(row: AnvlDropListRow): string | null {
  const fromColumn =
    typeof row.client_drop_id === 'string' ? row.client_drop_id.trim() : ''
  if (fromColumn) return fromColumn
  const parsed = persistedDropSchema.safeParse(row.draft_body)
  if (!parsed.success) return null
  return parsed.data.id
}

function rowToAdminListItem(
  row: AnvlDropListRow,
  activeDbDropId: string | null,
): AdminDropListItem | null {
  const parsed = persistedDropSchema.safeParse(row.draft_body)
  if (!parsed.success) return null

  const id = resolveClientDropId(row)
  if (!id) return null

  const body = parsed.data
  const status = row.status as DropStatus
  const isActive =
    activeDbDropId != null
      ? row.id === activeDbDropId
      : status === 'active'

  return {
    id,
    slug: row.slug,
    title: body.title,
    name: body.name,
    dropNumber: body.dropNumber,
    status,
    isActive,
    releaseDate: row.release_date ?? body.releaseDate,
    scheduledActivationAt:
      row.scheduled_activation_at ?? body.scheduledActivationAt,
    productCount: Array.isArray(body.productIds) ? body.productIds.length : 0,
    updatedAt: body.updatedAt,
    createdAt: body.createdAt,
  }
}

export type FetchAdminDropsListResult =
  | { ok: true; items: AdminDropListItem[] }
  | { ok: false; error: string }

/**
 * Admin drops table — live/active badge comes from `storefront_publication.active_drop_id`
 * (fallback: `anvl_drops.status = 'active'`, at most one row).
 */
export async function fetchAdminDropsListFromSupabase(): Promise<FetchAdminDropsListResult> {
  if (!getSupabasePublicEnv()) {
    return { ok: false, error: 'Supabase is not configured.' }
  }

  const client = getAdminSupabaseBrowserClient()
  if (!client) {
    return { ok: false, error: 'Supabase client is not available.' }
  }

  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) {
    return { ok: false, error: 'Not signed in.' }
  }

  const [dropsRes, pubRes] = await Promise.all([
    client
      .from('anvl_drops')
      .select(
        'id, slug, status, client_drop_id, release_date, scheduled_activation_at, updated_at, draft_body',
      )
      .order('slug'),
    client
      .from('storefront_publication')
      .select('active_drop_id')
      .eq('id', 1)
      .maybeSingle(),
  ])

  if (dropsRes.error) return { ok: false, error: dropsRes.error.message }
  if (pubRes.error) return { ok: false, error: pubRes.error.message }

  const activeDbDropId =
    typeof pubRes.data?.active_drop_id === 'string'
      ? pubRes.data.active_drop_id
      : null

  const items: AdminDropListItem[] = []
  for (const row of (dropsRes.data ?? []) as AnvlDropListRow[]) {
    const item = rowToAdminListItem(row, activeDbDropId)
    if (item) items.push(item)
  }

  return { ok: true, items }
}
