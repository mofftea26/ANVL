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
import { DEFAULT_LANDING_CONTENT } from '@/features/cms/landingContent/landingContent.zod'
import { parseShopConfig } from '@/features/cms/shop/shopExperience.zod'
import { DEFAULT_PDP_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import { DEFAULT_PASSPORT_CONTENT } from '@/features/cms/passportContent/passportContent.zod'
import { parseComingSoonConfig } from '@/features/cms/comingSoon/comingSoon.zod'
import { DEFAULT_LANDING_PAGE_KEY } from '@/features/landingPages/registry'

/** Last-resort projection when Supabase is unconfigured or the publication row is missing. */
export function defaultStorefrontProjection(): PublishedStorefrontProjection {
  return {
    activeLandingPageKey: DEFAULT_LANDING_PAGE_KEY,
    theme: DEFAULT_THEME_CONFIG,
    fonts: DEFAULT_FONT_LIBRARY_CONFIG,
    assets: DEFAULT_ASSET_CONFIG,
    mediaIndex: [],
    landingContent: DEFAULT_LANDING_CONTENT,
    shopConfig: parseShopConfig(undefined),
    pdpContent: { ...DEFAULT_PDP_CONTENT },
    passportContent: { ...DEFAULT_PASSPORT_CONTENT },
    comingSoon: parseComingSoonConfig(undefined),
    revision: 0,
    publishedAt: null,
  }
}

export async function loadStorefrontProjection(): Promise<PublishedStorefrontProjection> {
  const env = getSupabasePublicEnv()
  if (!env) return defaultStorefrontProjection()
  try {
    const p = await fetchPublishedStorefrontProjection(env)
    if (!p) {
      // Row id=1 missing or unreadable → storefront silently used the default
      // (ember) theme. Surface it so the publish/read loop is debuggable.
      console.warn(
        '[storefront] storefront_publication row id=1 returned no data — using default theme/assets.',
      )
      return defaultStorefrontProjection()
    }
    return p
  } catch (err) {
    console.error(
      '[storefront] failed to read storefront_publication — using default theme/assets.',
      err,
    )
    return defaultStorefrontProjection()
  }
}
