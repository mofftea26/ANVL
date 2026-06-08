import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  fetchPublishedStorefrontProjection,
  type PublishedStorefrontProjection,
} from '@/features/cms/api/publicStorefrontPublication'
import {
  DEFAULT_ASSET_CONFIG,
  DEFAULT_THEME_CONFIG,
} from '@/features/cms/config/cmsSiteConfig.zod'
import { DEFAULT_FONT_LIBRARY_CONFIG } from '@/features/cms/config/fontLibrary'
import { DEFAULT_LANDING_PAGE_KEY } from '@/features/landingPages/registry'

/** Last-resort projection when Supabase is unconfigured or the publication row is missing. */
export function defaultStorefrontProjection(): PublishedStorefrontProjection {
  return {
    activeLandingPageKey: DEFAULT_LANDING_PAGE_KEY,
    theme: DEFAULT_THEME_CONFIG,
    fonts: DEFAULT_FONT_LIBRARY_CONFIG,
    assets: DEFAULT_ASSET_CONFIG,
    mediaIndex: [],
    revision: 0,
    publishedAt: null,
  }
}

export async function loadStorefrontProjection(): Promise<PublishedStorefrontProjection> {
  const env = getSupabasePublicEnv()
  if (!env) return defaultStorefrontProjection()
  try {
    const p = await fetchPublishedStorefrontProjection(env)
    return p ?? defaultStorefrontProjection()
  } catch {
    return defaultStorefrontProjection()
  }
}
