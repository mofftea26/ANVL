import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { persistedWebsiteLayoutSchema } from '@/features/admin/website-layout/websiteLayout.persistence.zod'
import { persistedDropSchema } from '@/features/admin/drops/drops.persistence.zod'
import { persistedProductSchema } from '@/features/admin/products/products.persistence.zod'
import { persistedGlobalBrandSchema } from '@/features/admin/global-brand/globalBrand.persistence.zod'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import type { GlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.types'
import type { AdminProduct } from '@/features/admin/products/products.types'
import type { Drop } from '@/features/drops/drop.types'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import type { SiteSeoContent } from '@/features/cms/siteSeo.local'
import { parseSiteSeoUnknown } from '@/features/cms/siteSeo.local'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import type { ShopDropFilterOption } from '@/features/products/types/product.types'

/** Public homepage campaign cards — stored on `storefront_publication.campaigns`. */
export const storefrontCampaignSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
})

/** Lookbook strip — `storefront_publication.lookbook`. */
export const storefrontLookbookItemSchema = z.object({
  id: z.string(),
  alt: z.string(),
  src: z.string(),
})

/** Matches `ShopDropFilterOption` + SQL `catalog_drop_index` rows. */
export const catalogDropIndexRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  dropNumber: z.string(),
})

export type StorefrontCampaign = z.infer<typeof storefrontCampaignSchema>
export type StorefrontLookbookItem = z.infer<typeof storefrontLookbookItemSchema>

export type PublishedStorefrontProjection = {
  drop: Drop
  layout: WebsiteLayoutContent
  siteSeo: SiteSeoContent
  revision: number
  publishedAt: string | null
  /** Parsed `products_snapshot` (persistedProductSchema rows). */
  adminProducts: AdminProduct[]
  /** Parsed `catalog_drop_index` for PDP/shop meta + filters. */
  catalogDropIndex: ShopDropFilterOption[]
  /** Parsed `global_brand` merged with defaults when null/invalid. */
  globalBrand: GlobalBrandSettings
  campaigns: StorefrontCampaign[]
  lookbook: StorefrontLookbookItem[]
}

export type StorefrontPublicationRow = {
  published_drop_snapshot: unknown
  website_layout: unknown
  site_seo: unknown
  revision: number | string | null | undefined
  published_at: string | null
  products_snapshot?: unknown
  catalog_drop_index?: unknown
  global_brand?: unknown
  campaigns?: unknown
  lookbook?: unknown
}

const PUBLICATION_SELECT =
  'published_drop_snapshot, website_layout, site_seo, revision, published_at, products_snapshot, catalog_drop_index, global_brand, campaigns, lookbook'

function parseAdminProductsSnapshot(raw: unknown): AdminProduct[] {
  if (!Array.isArray(raw)) return []
  const out: AdminProduct[] = []
  for (const row of raw) {
    const r = persistedProductSchema.safeParse(row)
    if (r.success) out.push(r.data as AdminProduct)
  }
  return out
}

function parseCatalogDropIndex(raw: unknown): ShopDropFilterOption[] {
  if (!Array.isArray(raw)) return []
  const out: ShopDropFilterOption[] = []
  for (const row of raw) {
    const r = catalogDropIndexRowSchema.safeParse(row)
    if (r.success) out.push(r.data)
  }
  return out
}

function parseCampaigns(raw: unknown): StorefrontCampaign[] {
  if (!Array.isArray(raw)) return []
  const out: StorefrontCampaign[] = []
  for (const row of raw) {
    const r = storefrontCampaignSchema.safeParse(row)
    if (r.success) out.push(r.data)
  }
  return out
}

function parseLookbook(raw: unknown): StorefrontLookbookItem[] {
  if (!Array.isArray(raw)) return []
  const out: StorefrontLookbookItem[] = []
  for (const row of raw) {
    const r = storefrontLookbookItemSchema.safeParse(row)
    if (r.success) out.push(r.data)
  }
  return out
}

function mergePublicationGlobalBrand(raw: unknown): GlobalBrandSettings {
  const defaults = createDefaultGlobalBrandSettings()
  if (raw == null) return defaults
  const r = persistedGlobalBrandSchema.safeParse(raw)
  if (!r.success) return defaults
  return {
    ...defaults,
    emblemFallbackUrl:
      r.data.emblemFallbackUrl.trim() || defaults.emblemFallbackUrl,
    loadingEmblemFallbackUrl:
      r.data.loadingEmblemFallbackUrl.trim() ||
      defaults.loadingEmblemFallbackUrl,
  }
}

/** Pure normalizer for tests and RPC shaping — no network. */
export function normalizeStorefrontPublicationRow(
  data: StorefrontPublicationRow,
): PublishedStorefrontProjection | null {
  if (data.published_drop_snapshot == null) return null

  const dropResult = persistedDropSchema.safeParse(data.published_drop_snapshot)
  if (!dropResult.success) return null

  const stamp =
    typeof data.published_at === 'string' && data.published_at.length > 0
      ? data.published_at
      : new Date().toISOString()

  const layoutParsed = persistedWebsiteLayoutSchema.safeParse(data.website_layout)
  const layout: WebsiteLayoutContent = layoutParsed.success
    ? layoutParsed.data
    : createDefaultWebsiteLayout(stamp)

  const siteSeo = parseSiteSeoUnknown(data.site_seo)
  const revRaw = data.revision
  const revision =
    typeof revRaw === 'number'
      ? revRaw
      : typeof revRaw === 'string'
        ? Number.parseInt(revRaw, 10) || 0
        : 0

  const adminProducts = parseAdminProductsSnapshot(data.products_snapshot)
  const catalogDropIndex = parseCatalogDropIndex(data.catalog_drop_index)
  const globalBrand = mergePublicationGlobalBrand(data.global_brand)
  const campaigns = parseCampaigns(data.campaigns)
  const lookbook = parseLookbook(data.lookbook)

  return {
    drop: dropResult.data as Drop,
    layout,
    siteSeo,
    revision,
    publishedAt: data.published_at,
    adminProducts,
    catalogDropIndex,
    globalBrand,
    campaigns,
    lookbook,
  }
}

export function createSupabaseAnonClient(env: SupabasePublicEnv): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

const publicationFetchCoalesce = new Map<
  string,
  Promise<PublishedStorefrontProjection | null>
>()

async function fetchPublishedStorefrontProjectionOnce(
  env: SupabasePublicEnv,
): Promise<PublishedStorefrontProjection | null> {
  const supabase = createSupabaseAnonClient(env)
  const { data, error } = await supabase
    .from('storefront_publication')
    .select(PUBLICATION_SELECT)
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return normalizeStorefrontPublicationRow(data as StorefrontPublicationRow)
}

/**
 * Coalesces in-flight fetches per env so parallel loaders (landing + active drop + SEO)
 * share one round-trip.
 */
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
