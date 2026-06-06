/**
 * ANVL CMS API contracts — editorial SEO.
 *
 * Medusa split: **ANVL CMS** — editorial SEO, navigation, site settings.
 * Commerce (products, cart, checkout) stays a separate domain (Medusa later).
 *
 * The drop-builder / landing-acts contracts were removed in the CMS teardown
 * (landing pages are now code-owned — see `docs/cms-teardown-plan.md`).
 */

import type { SeoContent } from '@/features/cms/types/cms.types'

export const CMS_API_PREFIX = '/api/cms' as const

export type CmsSeoEntityType = 'page' | 'product'

export type CmsSeoByEntityResponse = SeoContent | null

export type CmsSeoPatchBody = Partial<SeoContent>
