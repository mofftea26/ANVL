import type { SeoClient } from '@/app/config/clients'
import { resolveSeoByPath } from '@/features/cms/api/resolveSeoByPath'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'
import { fetchPublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'

/*
 * `createSupabaseCmsPublicReadSlice` and `createSupabaseSiteSettingsReadSlice`
 * lived here until 2026-08-05. They implemented `CmsClient` /
 * `SiteSettingsClient`, both of which had ZERO call sites — nothing ever read
 * `runtimeClients.cms` or `runtimeClients.siteSettings`. The slices returned
 * static defaults (nav from `staticWebsiteNavigation`, campaigns/lookbook from
 * the mock fixture, layout from `websiteLayout.defaults`), so they were not
 * "Supabase readers" in any real sense either — leftovers from the removed
 * drop-builder. Deleted with their contracts and adapters; the storefront
 * reads its chrome from code defaults directly.
 */

export function createSupabaseSeoReadSlice(
  env: SupabasePublicEnv,
): Pick<SeoClient, 'getSeoByPath' | 'getSiteSeo'> {
  return {
    async getSeoByPath(path: string) {
      return resolveSeoByPath(path)
    },

    // Read the published `site_seo` blob (SEO defaults + analytics tags) from
    // the coalesced publication fetch; fall back to code defaults if the row or
    // column is unavailable (older DB / read failure).
    async getSiteSeo() {
      try {
        const projection = await fetchPublishedStorefrontProjection(env)
        return projection?.siteSeo ?? defaultSiteSeoContent()
      } catch {
        return defaultSiteSeoContent()
      }
    },
  }
}
