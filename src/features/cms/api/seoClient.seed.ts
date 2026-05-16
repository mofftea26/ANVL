import type { SeoClient } from '@/app/config/clients'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { SEED_DROP, SEED_LANDING_PAGE_CMS } from '@/features/cms/api/seedSnapshots'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'

const seedSeoCtx = {
  loadLanding: () => SEED_LANDING_PAGE_CMS,
  getActiveDrop: () => SEED_DROP,
  getDropBySlug: (slug: string) => (slug === SEED_DROP.slug ? SEED_DROP : undefined),
}

export const seedSeoClient: SeoClient = {
  async getSeoByPath(path: string) {
    return resolveSeoByPath(path, seedSeoCtx)
  },
  async getSiteSeo() {
    return defaultSiteSeoContent()
  },
}
