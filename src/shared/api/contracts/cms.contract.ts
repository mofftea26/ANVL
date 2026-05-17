/**
 * ANVL CMS API contracts — drops, landing content, SEO.
 *
 * Medusa split: **ANVL CMS** — drops, themes, acts, editorial SEO, navigation.
 * Commerce (products, cart, checkout) stays a separate domain (Medusa later).
 */

import type { Drop } from '@/features/drops/drop.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { SeoContent } from '@/features/cms/types/cms.types'
import type { DateRangeFilter, ListSort, OffsetPaginatedResult, OffsetPaginationQuery } from './common.types'

export const CMS_API_PREFIX = '/api/cms' as const

export type CmsDropListItemWire = Pick<
  Drop,
  'id' | 'slug' | 'title' | 'name' | 'dropNumber' | 'status' | 'isActive' | 'updatedAt' | 'createdAt'
> & {
  productCount: number
  releaseDate?: string
  scheduledActivationAt?: string
}

export type CmsDropListSortField =
  | 'updatedAt'
  | 'createdAt'
  | 'title'
  | 'releaseDate'
  | 'scheduledActivationAt'
  | 'status'

export type CmsDropListQuery = OffsetPaginationQuery & {
  search?: string
  status?: Drop['status'] | 'all'
  sort?: ListSort<CmsDropListSortField>
  updatedBetween?: DateRangeFilter
  releaseBetween?: DateRangeFilter
}

export type CmsDropListResponse = OffsetPaginatedResult<CmsDropListItemWire>

export type CmsActiveDropResponse = Drop | null

export type CmsDropByIdResponse = Drop

export type CmsDropCreateBody = Omit<Drop, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  createdAt?: string
  updatedAt?: string
}

export type CmsDropUpdateBody = Partial<Omit<Drop, 'id' | 'createdAt'>> & {
  updatedAt?: string
}

export type CmsSetActiveDropBody = {
  dropId: string
}

export type CmsScheduleDropBody = {
  activationIso: string
}

export type CmsLandingContentResponse = LandingPageCmsContent

export type CmsLandingContentUpdateBody = Partial<LandingPageCmsContent>

export type CmsSeoEntityType = 'page' | 'drop' | 'product'

export type CmsSeoByEntityResponse = SeoContent | null

export type CmsSeoPatchBody = Partial<SeoContent>
