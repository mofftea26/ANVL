import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import type { Drop } from '@/features/drops/drop.types'
import { getActiveDrop } from '@/features/admin/drops/drops.service'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import {
  normalizeLandingCmsImport,
  readLandingCmsFromStorage,
} from '@/features/cms/read/landingCmsRuntime'
import { ensureDropSystemHydrated } from '@/features/cms/read/dropRuntime'
import { SEED_DROP, SEED_WEBSITE_LAYOUT } from '@/features/cms/api/seedSnapshots'

/**
 * Single resolver for “which drop powers the public storefront” — matches
 * {@link seedCmsClient} on SSR (`SEED_DROP`) and persisted CMS state in the browser.
 */
export function resolveStorefrontActiveDrop(): Drop | null {
  if (typeof window === 'undefined') {
    return structuredClone(SEED_DROP)
  }
  ensureDropSystemHydrated()
  return getActiveDrop()
}

/** Website layout paired with {@link resolveStorefrontActiveDrop} (SSR uses seed layout). */
export function resolveStorefrontWebsiteLayout(): WebsiteLayoutContent {
  if (typeof window === 'undefined') {
    return structuredClone(SEED_WEBSITE_LAYOUT)
  }
  return getWebsiteLayoutContent()
}

/**
 * Canonical composed landing CMS — used by loaders, hooks, and the seed CMS adapter.
 * Pass `forceSsrSnapshot` in Vitest to assert parity with the SSR/seed pipeline under jsdom.
 */
export function getResolvedStorefrontLandingCmsSync(options?: {
  forceSsrSnapshot?: boolean
}): LandingPageCmsContent {
  const useSeed =
    options?.forceSsrSnapshot === true || typeof window === 'undefined'

  if (useSeed) {
    return composeLandingPageFromDrop(
      structuredClone(SEED_DROP),
      structuredClone(SEED_WEBSITE_LAYOUT),
    )
  }

  ensureDropSystemHydrated()
  const active = getActiveDrop()
  const layout = getWebsiteLayoutContent()

  if (!active) {
    return normalizeLandingCmsImport(readLandingCmsFromStorage())
  }

  return composeLandingPageFromDrop(active, layout)
}
