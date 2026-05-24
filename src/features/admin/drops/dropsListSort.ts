import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import type { DropStatus } from '@/features/drops/drop.types'

const STATUS_SORT_RANK: Record<DropStatus, number> = {
  draft: 10,
  scheduled: 20,
  inactive: 30,
  active: 40,
  archived: 50,
}

function parseOptionalTime(iso?: string): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

function compareDropStatus(a: AdminDropListItem, b: AdminDropListItem): number {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
  return STATUS_SORT_RANK[a.status] - STATUS_SORT_RANK[b.status]
}

export type DropsListSortKey =
  | 'updatedAt:desc'
  | 'updatedAt:asc'
  | 'title:asc'
  | 'title:desc'
  | 'slug:asc'
  | 'slug:desc'
  | 'status:asc'
  | 'releaseDate:desc'
  | 'releaseDate:asc'
  | 'scheduledActivationAt:asc'
  | 'scheduledActivationAt:desc'
  | 'productCount:desc'
  | 'productCount:asc'

export const DROPS_LIST_SORT_OPTIONS: Array<{ value: DropsListSortKey; label: string }> = [
  { value: 'updatedAt:desc', label: 'Last edited (newest)' },
  { value: 'updatedAt:asc', label: 'Last edited (oldest)' },
  { value: 'title:asc', label: 'Campaign (A–Z)' },
  { value: 'title:desc', label: 'Campaign (Z–A)' },
  { value: 'slug:asc', label: 'Slug (A–Z)' },
  { value: 'status:asc', label: 'Status' },
  { value: 'releaseDate:desc', label: 'Release (newest)' },
  { value: 'releaseDate:asc', label: 'Release (oldest)' },
  { value: 'scheduledActivationAt:asc', label: 'Scheduled (soonest)' },
  { value: 'productCount:desc', label: 'Products (most)' },
]

export function sortDropListRows(
  rows: AdminDropListItem[],
  sortKey: DropsListSortKey,
): AdminDropListItem[] {
  const [field, direction] = sortKey.split(':') as [string, 'asc' | 'desc']
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0
    switch (field) {
      case 'updatedAt':
        cmp = parseOptionalTime(a.updatedAt) - parseOptionalTime(b.updatedAt)
        break
      case 'title':
        cmp = a.title.localeCompare(b.title)
        break
      case 'slug':
        cmp = a.slug.localeCompare(b.slug)
        break
      case 'status':
        cmp = compareDropStatus(a, b)
        break
      case 'releaseDate':
        cmp = parseOptionalTime(a.releaseDate) - parseOptionalTime(b.releaseDate)
        break
      case 'scheduledActivationAt':
        cmp =
          parseOptionalTime(a.scheduledActivationAt) - parseOptionalTime(b.scheduledActivationAt)
        break
      case 'productCount':
        cmp = a.productCount - b.productCount
        break
      default:
        cmp = 0
    }
    return cmp
  })
  return direction === 'desc' ? sorted.reverse() : sorted
}
