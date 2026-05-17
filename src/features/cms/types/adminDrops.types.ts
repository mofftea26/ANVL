import type { DropStatus } from '@/features/drops/drop.types'

/** Row shape for the admin Drops list (derived from `Drop`). */
export type AdminDropListItem = {
  id: string
  slug: string
  title: string
  name: string
  dropNumber: string
  status: DropStatus
  isActive: boolean
  releaseDate?: string
  scheduledActivationAt?: string
  productCount: number
  updatedAt: string
  createdAt: string
}
