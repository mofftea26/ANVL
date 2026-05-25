import type { Drop, DropStatus } from '@/features/admin/drops/drops.types'
import { mergeDropPartial } from '@/features/admin/drops/drops.service'
import { persistedDropSchema } from '@/features/admin/drops/drops.persistence.zod'

export type AnvlDropRemoteColumns = {
  slug: string
  status: string
  client_drop_id?: string | null
  release_date?: string | null
  scheduled_activation_at?: string | null
}

export function normalizeRemoteDropStatus(status: string): DropStatus {
  if (status === 'active' || status === 'scheduled') return status
  return 'inactive'
}

export function resolveRemoteClientDropId(
  body: unknown,
  columns: Pick<AnvlDropRemoteColumns, 'client_drop_id'>,
): string | null {
  const fromColumn =
    typeof columns.client_drop_id === 'string'
      ? columns.client_drop_id.trim()
      : ''
  if (fromColumn) return fromColumn

  const strict = persistedDropSchema.safeParse(body)
  if (strict.success) return strict.data.id

  if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
    const id = (body as { id?: unknown }).id
    if (typeof id === 'string' && id.trim()) return id.trim()
  }

  return null
}

/** Parse a remote `anvl_drops` row body, falling back to merge defaults when Zod rejects legacy shapes. */
export function parseRemoteDropRecord(
  body: unknown,
  columns: AnvlDropRemoteColumns,
): Drop | null {
  const clientId = resolveRemoteClientDropId(body, columns)
  if (!clientId) return null

  const status = normalizeRemoteDropStatus(columns.status)
  const basePartial =
    typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Partial<Drop>)
      : {}

  const strict = persistedDropSchema.safeParse(body)
  const merged = strict.success
    ? (strict.data as Drop)
    : mergeDropPartial({
        ...basePartial,
        id: clientId,
        slug: columns.slug,
      })

  return mergeDropPartial({
    ...merged,
    id: clientId,
    slug: columns.slug,
    status,
    isActive: status === 'active',
    releaseDate: columns.release_date ?? merged.releaseDate,
    scheduledActivationAt:
      columns.scheduled_activation_at ?? merged.scheduledActivationAt,
  })
}
