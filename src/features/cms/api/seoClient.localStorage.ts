import type { SeoClient } from '@/app/config/clients'
import { getActiveDrop, getDropBySlug } from '@/features/admin/drops/drops.service'
import { getLandingCmsContent } from '@/features/admin/landing-cms/landingCms.service'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { getSiteSeoContent } from '@/features/cms/siteSeo.local'

const browserSeoCtx = {
  loadLanding: () => getLandingCmsContent(),
  getActiveDrop: () => getActiveDrop(),
  getDropBySlug: (slug: string) => getDropBySlug(slug),
}

export const localStorageSeoClient: SeoClient = {
  async getSeoByPath(path: string) {
    return resolveSeoByPath(path, browserSeoCtx)
  },
  async getSiteSeo() {
    return getSiteSeoContent()
  },
}
