import type { Drop } from '@/features/admin/drops/drops.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { cmsMockData } from '@/features/cms/data/cms.mock'
import type { SeoContent } from '@/features/cms/types/cms.types'

export type SeoPathResolutionContext = {
  loadLanding: () => LandingPageCmsContent
  getActiveDrop: () => Drop | null
  getDropBySlug: (slug: string) => Drop | undefined
}

export function resolveSeoByPath(
  path: string,
  ctx: SeoPathResolutionContext,
): SeoContent | null {
  if (path === '/') {
    const landing = ctx.loadLanding()
    return {
      title: landing.seo.title,
      description: landing.seo.description,
      canonicalPath: landing.seo.path,
      ogImage: landing.seo.ogImage,
    }
  }
  if (path.startsWith('/drop/')) {
    const slug = path.replace('/drop/', '').split('/')[0] ?? ''
    const drop = ctx.getDropBySlug(slug)
    const active = ctx.getActiveDrop()
    if (!drop || !active || drop.id !== active.id) return null
    return {
      title: drop.seo.title,
      description: drop.seo.description,
      canonicalPath: path,
      ogImage: drop.seo.ogImage,
    }
  }
  return cmsMockData.seoByPath[path] ?? null
}
