import { DEFAULT_LANDING_PAGE_KEY, resolveActiveLandingPageKey } from './registry'

/**
 * Resolves the storefront's active landing-page key.
 *
 * SEAM: the simplified CMS (next phase) persists `activeLandingPageKey` in the
 * `cms_settings` Supabase row + a local mirror. When that lands, this is the one
 * place that reads it — pass the raw value through {@link resolveActiveLandingPageKey}
 * so an unknown/disabled key always degrades to the default page.
 *
 * Until then it returns the default key. Kept as a function (not a constant) so
 * the call sites in route loaders never change when CMS reads are wired in.
 */
export function getActiveLandingPageKey(rawCmsKey?: string | null): string {
  return resolveActiveLandingPageKey(rawCmsKey ?? DEFAULT_LANDING_PAGE_KEY)
}
