import type { SeoClient } from '@/app/config/clients'
import { getActiveDrop, getDropBySlug } from '@/features/admin/drops/drops.service'
import { getLandingCmsContent } from '@/features/admin/landing-cms/landingCms.service'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'

const browserSeoCtx = {
  loadLanding: () => getLandingCmsContent(),
  getActiveDrop: () => getActiveDrop(),
  getDropBySlug: (slug: string) => getDropBySlug(slug),
}

/**
 * Client SEO resolver — follows persisted drops + landing CMS in localStorage.
 * TODO: replace with CMS/API-backed SEO when the backend ships.
 */
export const localStorageSeoClient: SeoClient = {
  async getSeoByPath(path: string) {
    return resolveSeoByPath(path, browserSeoCtx)
  },
}
