import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
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
import { createAnvlSupabaseClient } from '@/features/cms/api/createAnvlSupabaseClient'
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
import { DEFAULT_LANDING_PAGE_KEY } from '@/features/landingPages/registry'

export const SUPABASE_PUBLICATION_ANON_AUTH_STORAGE_KEY =
  'anvl.supabase.storefront-public.v1'

const publicationAnonClients = new Map<string, SupabaseClient>()

export function getSupabasePublicationAnonClient(
  env: SupabasePublicEnv,
): SupabaseClient {
  const key = `${env.url}#${env.anonKey}`
  let client = publicationAnonClients.get(key)
  if (!client) {
    client = createAnvlSupabaseClient(env, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: SUPABASE_PUBLICATION_ANON_AUTH_STORAGE_KEY,
      },
    })
    publicationAnonClients.set(key, client)
  }
  return client
}

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
}

const PUBLICATION_SELECT =
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
    revision,
    publishedAt: data.published_at,
  }
}

const publicationFetchCoalesce = new Map<
  string,
  Promise<PublishedStorefrontProjection | null>
>()

async function fetchPublishedStorefrontProjectionOnce(
  env: SupabasePublicEnv,
): Promise<PublishedStorefrontProjection | null> {
  const supabase = getSupabasePublicationAnonClient(env)
  let { data, error } = await supabase
    .from('storefront_publication')
    .select(PUBLICATION_SELECT)
    .eq('id', 1)
    .maybeSingle()

  // Progressive fallback while migrations are pending: drop `pdp_content`, then
  // `shop_config`, then `landing_content`, so an older DB still serves the rest.
  if (error && isPostgrestMissingColumnError(error, 'pdp_content')) {
    ;({ data, error } = await supabase
      .from('storefront_publication')
      .select(PUBLICATION_SELECT_NO_PDP)
      .eq('id', 1)
      .maybeSingle())
  }

  if (error && isPostgrestMissingColumnError(error, 'shop_config')) {
    ;({ data, error } = await supabase
      .from('storefront_publication')
      .select(PUBLICATION_SELECT_NO_SHOP)
      .eq('id', 1)
      .maybeSingle())
  }

  if (error && isPostgrestMissingColumnError(error, 'landing_content')) {
    ;({ data, error } = await supabase
      .from('storefront_publication')
      .select(PUBLICATION_SELECT_LEGACY)
      .eq('id', 1)
      .maybeSingle())
  }

  if (error) throw error
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
