import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { persistedWebsiteLayoutSchema } from '@/features/admin/website-layout/websiteLayout.persistence.zod'
import { persistedDropSchema } from '@/features/admin/drops/drops.persistence.zod'
import type { Drop } from '@/features/drops/drop.types'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'
import type { SiteSeoContent } from '@/features/cms/siteSeo.local'
import { parseSiteSeoUnknown } from '@/features/cms/siteSeo.local'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

export type PublishedStorefrontProjection = {
  drop: Drop
  layout: WebsiteLayoutContent
  siteSeo: SiteSeoContent
  revision: number
  publishedAt: string | null
}

export type StorefrontPublicationRow = {
  published_drop_snapshot: unknown
  website_layout: unknown
  site_seo: unknown
  revision: number | string | null | undefined
  published_at: string | null
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

  return {
    drop: dropResult.data as Drop,
    layout,
    siteSeo,
    revision,
    publishedAt: data.published_at,
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
    .select(
      'published_drop_snapshot, website_layout, site_seo, revision, published_at',
    )
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
