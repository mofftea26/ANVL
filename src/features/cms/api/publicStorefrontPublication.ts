import { z } from 'zod'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import {
  parseAssetConfig,
  type AssetConfig,
  type ThemeConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'
import { parseFontLibrary, type FontLibraryConfig } from '@/features/cms/config/fontLibrary'
import {
  parseThemeLibrary,
  resolveThemeConfig,
} from '@/features/cms/config/themeLibrary'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { restSelectMaybeSingle } from '@/features/cms/api/supabaseRest'
import { isPostgrestMissingColumnError } from '@/features/cms/api/storefrontPublicationColumns'
import {
  parseLandingContentConfig,
  type LandingContentConfig,
} from '@/features/cms/landingContent/landingContent.zod'
import { parseShopConfig, type ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import {
  parsePdpContent,
  type PdpContentConfig,
} from '@/features/cms/pdpContent/pdpContent.zod'
import {
  parseComingSoonConfig,
  type ComingSoonConfig,
} from '@/features/cms/comingSoon/comingSoon.zod'
import {
  parsePassportContent,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'
import { DEFAULT_LANDING_PAGE_KEY } from '@/features/landingPages/registry'

const mediaIndexEntrySchema = z.object({
  id: z.string(),
  path: z.string(),
  alt: z.string(),
  mime: z.string(),
  w: z.number().nullable(),
  h: z.number().nullable(),
  updatedAt: z.string(),
})

export type PublishedStorefrontProjection = {
  activeLandingPageKey: string
  theme: ThemeConfig
  /** Full font library for storefront @font-face / Google Fonts loading. */
  fonts: FontLibraryConfig
  assets: AssetConfig
  mediaIndex: MediaIndexEntry[]
  /** Per-landing-key CMS copy overrides; code defaults fill every gap. */
  landingContent: LandingContentConfig
  /** Shop Experience layout/behavior/copy config; code defaults fill every gap. */
  shopConfig: ShopConfig
  /** Per-product PDP editorial content keyed by slug; code/product fill every gap. */
  pdpContent: PdpContentConfig
  /** Per-product passport section content keyed by slug; pdp/product fill gaps. */
  passportContent: PassportContentConfig
  /** Coming Soon site mode (enabled toggle + reveal-page content/SEO). */
  comingSoon: ComingSoonConfig
  revision: number
  publishedAt: string | null
}

export type StorefrontPublicationRow = {
  revision: number | string | null | undefined
  published_at: string | null
  active_landing_page_key?: unknown
  theme_config?: unknown
  font_config?: unknown
  asset_config?: unknown
  media_index?: unknown
  landing_content?: unknown
  shop_config?: unknown
  pdp_content?: unknown
  passport_content?: unknown
  coming_soon?: unknown
}

const PUBLICATION_SELECT =
  'revision, published_at, active_landing_page_key, theme_config, font_config, asset_config, media_index, landing_content, shop_config, pdp_content, passport_content, coming_soon'

/** Pre-`passport_content` column list — retry path while that migration is pending. */
const PUBLICATION_SELECT_NO_PASSPORT =
  'revision, published_at, active_landing_page_key, theme_config, font_config, asset_config, media_index, landing_content, shop_config, pdp_content, coming_soon'

/** Pre-`coming_soon` column list — retry path while that migration is pending. */
const PUBLICATION_SELECT_NO_COMING_SOON =
  'revision, published_at, active_landing_page_key, theme_config, font_config, asset_config, media_index, landing_content, shop_config, pdp_content'

/** Pre-`pdp_content` column list — retry path while that migration is pending. */
const PUBLICATION_SELECT_NO_PDP =
  'revision, published_at, active_landing_page_key, theme_config, font_config, asset_config, media_index, landing_content, shop_config'

/** Pre-`shop_config` column list — retry path while that migration is pending. */
const PUBLICATION_SELECT_NO_SHOP =
  'revision, published_at, active_landing_page_key, theme_config, font_config, asset_config, media_index, landing_content'

/** Pre-`landing_content` column list — retry path while the migration is pending. */
const PUBLICATION_SELECT_LEGACY =
  'revision, published_at, active_landing_page_key, theme_config, font_config, asset_config, media_index'

function parseMediaIndex(raw: unknown): MediaIndexEntry[] {
  if (!Array.isArray(raw)) return []
  const out: MediaIndexEntry[] = []
  for (const row of raw) {
    const r = mediaIndexEntrySchema.safeParse(row)
    if (r.success) out.push(r.data)
  }
  return out
}

export function normalizeStorefrontPublicationRow(
  data: StorefrontPublicationRow,
): PublishedStorefrontProjection | null {
  const revRaw = data.revision
  const revision =
    typeof revRaw === 'number'
      ? revRaw
      : typeof revRaw === 'string'
        ? Number.parseInt(revRaw, 10) || 0
        : 0

  const activeLandingPageKey =
    typeof data.active_landing_page_key === 'string' &&
    data.active_landing_page_key.length > 0
      ? data.active_landing_page_key
      : DEFAULT_LANDING_PAGE_KEY

  // A single global theme drives the whole storefront — the active landing page
  // no longer influences the palette.
  const theme = resolveThemeConfig(parseThemeLibrary(data.theme_config))

  return {
    activeLandingPageKey,
    theme,
    fonts: parseFontLibrary(data.font_config),
    assets: parseAssetConfig(data.asset_config),
    mediaIndex: parseMediaIndex(data.media_index),
    landingContent: parseLandingContentConfig(data.landing_content),
    shopConfig: parseShopConfig(data.shop_config),
    pdpContent: parsePdpContent(data.pdp_content),
    passportContent: parsePassportContent(data.passport_content),
    comingSoon: parseComingSoonConfig(data.coming_soon),
    revision,
    publishedAt: data.published_at,
  }
}

const publicationFetchCoalesce = new Map<
  string,
  Promise<PublishedStorefrontProjection | null>
>()

/** Single-row PostgREST select of the publication row for a column list. */
function selectPublicationRow(env: SupabasePublicEnv, columns: string) {
  // PostgREST `select` is comma-separated with no spaces.
  return restSelectMaybeSingle(
    env,
    'storefront_publication',
    `id=eq.1&select=${columns.replace(/\s+/g, '')}`,
  )
}

async function fetchPublishedStorefrontProjectionOnce(
  env: SupabasePublicEnv,
): Promise<PublishedStorefrontProjection | null> {
  let { data, error } = await selectPublicationRow(env, PUBLICATION_SELECT)

  // Progressive fallback while migrations are pending: drop `passport_content`,
  // then `coming_soon`, then `pdp_content`, then `shop_config`, then
  // `landing_content`, so an older DB still serves the rest.
  if (error && isPostgrestMissingColumnError(error, 'passport_content')) {
    ;({ data, error } = await selectPublicationRow(env, PUBLICATION_SELECT_NO_PASSPORT))
  }

  if (error && isPostgrestMissingColumnError(error, 'coming_soon')) {
    ;({ data, error } = await selectPublicationRow(
      env,
      PUBLICATION_SELECT_NO_COMING_SOON,
    ))
  }

  if (error && isPostgrestMissingColumnError(error, 'pdp_content')) {
    ;({ data, error } = await selectPublicationRow(env, PUBLICATION_SELECT_NO_PDP))
  }

  if (error && isPostgrestMissingColumnError(error, 'shop_config')) {
    ;({ data, error } = await selectPublicationRow(env, PUBLICATION_SELECT_NO_SHOP))
  }

  if (error && isPostgrestMissingColumnError(error, 'landing_content')) {
    ;({ data, error } = await selectPublicationRow(env, PUBLICATION_SELECT_LEGACY))
  }

  if (error) throw new Error(error.message ?? 'storefront_publication read failed')
  if (!data) return null
  return normalizeStorefrontPublicationRow(data as StorefrontPublicationRow)
}

export async function fetchPublishedStorefrontProjection(
  env: SupabasePublicEnv,
): Promise<PublishedStorefrontProjection | null> {
  const key = `${env.url}#${env.anonKey}`
  const inflight = publicationFetchCoalesce.get(key)
  if (inflight) return inflight
  const started = fetchPublishedStorefrontProjectionOnce(env).finally(() => {
    publicationFetchCoalesce.delete(key)
  })
  publicationFetchCoalesce.set(key, started)
  return started
}
