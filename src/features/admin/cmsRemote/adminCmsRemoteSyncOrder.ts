import type { Drop } from '@/features/admin/drops/drops.types'

/** Patch drop JSON when demoting so storefront-shaped fields stay coherent. */
export function demoteDropBody(
  dropBody: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...dropBody,
    status: 'inactive',
    isActive: false,
    updatedAt: new Date().toISOString(),
  }
}

/** @deprecated use demoteDropBody */
export const demoteDropDraftBody = demoteDropBody

/** Ensure at most one local row carries `status: 'active'` before remote upsert. */
export function clampLocalDropsForSync(
  drops: Drop[],
  activeClientId: string | null,
): Drop[] {
  return drops.map((drop) => {
    if (activeClientId && drop.id === activeClientId) return drop
    if (drop.status === 'active' || drop.isActive) {
      return { ...drop, status: 'inactive', isActive: false }
    }
    return drop
  })
}

/**
 * Non-active rows first, intended active row last — avoids
 * `anvl_drops_single_active` violations during sequential upserts.
 */
export function orderDropsForRemoteSync(
  drops: Drop[],
  activeClientId: string | null,
): Drop[] {
  const clamped = clampLocalDropsForSync(drops, activeClientId)
  if (!activeClientId) return clamped
  const activeDrop = clamped.find((d) => d.id === activeClientId)
  const rest = clamped.filter((d) => d.id !== activeClientId)
  return activeDrop ? [...rest, activeDrop] : rest
}

export type AnvlDropActiveRow = {
  id: string
  client_drop_id?: string | null
  body?: unknown
}

/** Returns DB row ids that must be demoted before promoting a different active drop. */
export function activeDropRowIdsToDemote(
  rows: AnvlDropActiveRow[],
  keepActiveClientId: string | null,
): string[] {
  const out: string[] = []
  for (const row of rows) {
    const cid =
      typeof row.client_drop_id === 'string' ? row.client_drop_id.trim() : ''
    const shouldStayActive =
      keepActiveClientId !== null && cid === keepActiveClientId
    if (!shouldStayActive) out.push(row.id)
  }
  return out
}
