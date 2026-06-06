import { cmsMockData } from '@/features/cms/data/cms.mock'
import type { SeoContent } from '@/features/cms/types/cms.types'

/**
 * Per-path SEO cards for public routes. Drop-builder paths were removed in the
 * CMS teardown; `/` and other static routes resolve from the mock SEO map until
 * a CMS/API-backed SEO document store ships.
 */
export function resolveSeoByPath(path: string): SeoContent | null {
  return cmsMockData.seoByPath[path] ?? null
}
