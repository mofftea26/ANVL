import type { SeoClient } from '@/app/config/clients'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { SEED_DROP, SEED_LANDING_PAGE_CMS } from '@/features/cms/api/seedSnapshots'

const seedSeoCtx = {
  loadLanding: () => SEED_LANDING_PAGE_CMS,
  getActiveDrop: () => SEED_DROP,
  getDropBySlug: (slug: string) => (slug === SEED_DROP.slug ? SEED_DROP : undefined),
}

/**
 * SSR-safe SEO resolver — oath seed snapshot + static path map in `cmsMockData`.
 * TODO: replace with CMS-backed SEO documents when the backend ships.
 */
export const seedSeoClient: SeoClient = {
  async getSeoByPath(path: string) {
    return resolveSeoByPath(path, seedSeoCtx)
  },
}
