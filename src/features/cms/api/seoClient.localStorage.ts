import type { SeoClient } from '@/app/config/clients'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import { getSiteSeoContent } from '@/features/cms/siteSeo.local'

export const localStorageSeoClient: SeoClient = {
  async getSeoByPath(path: string) {
    return resolveSeoByPath(path)
  },
  async getSiteSeo() {
    return getSiteSeoContent()
  },
}
