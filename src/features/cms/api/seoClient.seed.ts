import type { SeoClient } from '@/app/config/clients'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { getDropBySlug } from '@/features/cms/read/dropRuntime'
import {
  getResolvedStorefrontLandingCmsSync,
  resolveStorefrontActiveDrop,
} from '@/features/cms/runtime/storefrontCmsSync'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'

const seedSeoCtx = {
  loadLanding: () => getResolvedStorefrontLandingCmsSync(),
  getActiveDrop: () => resolveStorefrontActiveDrop(),
  getDropBySlug: (slug: string) => getDropBySlug(slug),
}

export const seedSeoResolutionContext: typeof seedSeoCtx = seedSeoCtx

export const seedSeoClient: SeoClient = {
  async getSeoByPath(path: string) {
    return resolveSeoByPath(path, seedSeoCtx)
  },
  async getSiteSeo() {
    return defaultSiteSeoContent()
  },
}
