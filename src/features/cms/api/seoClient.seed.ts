import type { SeoClient } from '@/app/config/clients'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'

export const seedSeoClient: SeoClient = {
  async getSeoByPath(path: string) {
    return resolveSeoByPath(path)
  },
  async getSiteSeo() {
    return defaultSiteSeoContent()
  },
}
