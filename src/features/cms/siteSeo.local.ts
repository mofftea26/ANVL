import { z } from 'zod'
import { BRAND } from '@/shared/constants/brand'
import {
  SEO_STRUCTURED_DATA_TYPES,
  type SeoFieldPatch,
  type SeoStructuredDataType,
} from '@/features/cms/types/cms.types'

export const SITE_SEO_STORAGE_KEY = 'anvl.siteSeo.v1'
export const SITE_SEO_CHANGE_EVENT = 'anvl:siteSeo:change'

export type SiteStaticSeoPath = '/' | '/shop' | '/about' | '/size-guide'

export type SiteSeoGlobalDefaults = {
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  noIndex?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  defaultShareImage?: string
  structuredDataType?: SeoStructuredDataType
}

export type MarketingToolProvider =
  | 'gtm'
  | 'ga4'
  | 'metaPixel'
  | 'hotjar'
  | 'googleSiteVerification'
  | 'customScript'

export type MarketingToolEntry = {
  id: string
  provider: MarketingToolProvider
  snippetId: string
  enabled: boolean
}

export type SiteTechnicalSeo = {
  robotsIndex?: boolean
  sitemapEnabled?: boolean
  hreflangNotes?: string
}

export type SiteSeoContent = {
  globalDefaults: SiteSeoGlobalDefaults
  staticPages: Partial<Record<SiteStaticSeoPath, SeoFieldPatch>>
  marketingTools?: MarketingToolEntry[]
  technical?: SiteTechnicalSeo
}

const structuredEnum = z.enum(SEO_STRUCTURED_DATA_TYPES)
const patchSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    canonicalPath: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    canonicalUrl: z.string().optional(),
    noIndex: z.boolean().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    twitterImage: z.string().optional(),
    structuredDataType: structuredEnum.optional(),
  })
  .strict()

const globalDefaultsSchema = patchSchema.extend({
  defaultShareImage: z.string().optional(),
})

const STATIC_SEO_PATHS: SiteStaticSeoPath[] = [
  '/',
  '/shop',
  '/about',
  '/size-guide',
]

/**
 * `storefront_publication.site_seo` (and older localStorage blobs) sometimes
 * contain `staticPages` keys with `null` / `undefined` placeholders. Strip
 * those so Zod `z.record` validation does not throw during admin hydration.
 */
export function sanitizeStaticPagesLoose(
  raw: unknown,
): Partial<Record<SiteStaticSeoPath, SeoFieldPatch>> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const src = raw as Record<string, unknown>
  const out: Partial<Record<SiteStaticSeoPath, SeoFieldPatch>> = {}
  for (const p of STATIC_SEO_PATHS) {
    const v = src[p]
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      const parsed = patchSchema.safeParse(v)
      if (parsed.success) out[p] = parsed.data
    }
  }
  return out
}

const marketingToolSchema = z.object({
  id: z.string(),
  provider: z.enum([
    'gtm',
    'ga4',
    'metaPixel',
    'hotjar',
    'googleSiteVerification',
    'customScript',
  ]),
  snippetId: z.string(),
  enabled: z.boolean(),
})

const technicalSeoSchema = z.object({
  robotsIndex: z.boolean().optional(),
  sitemapEnabled: z.boolean().optional(),
  hreflangNotes: z.string().optional(),
})

const siteSeoSchema = z
  .object({
    globalDefaults: globalDefaultsSchema,
    staticPages: z.unknown().optional(),
    marketingTools: z.array(marketingToolSchema).optional(),
    technical: technicalSeoSchema.optional(),
  })
  .transform((data) => ({
    globalDefaults: data.globalDefaults,
    staticPages: sanitizeStaticPagesLoose(data.staticPages),
    marketingTools: data.marketingTools ?? [],
    technical: data.technical ?? {},
  }))

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

const siteSeoEvents =
  typeof window !== 'undefined' ? new EventTarget() : null

function notifySiteSeoChange() {
  siteSeoEvents?.dispatchEvent(new Event(SITE_SEO_CHANGE_EVENT))
}

export function defaultSiteSeoContent(): SiteSeoContent {
  return {
    globalDefaults: {
      defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.png`,
    },
    staticPages: {},
    marketingTools: [],
    technical: { robotsIndex: true, sitemapEnabled: true },
  }
}

/** Parse site SEO blob from DB (`storefront_publication.site_seo`) or unknown JSON. */
export function parseSiteSeoUnknown(raw: unknown): SiteSeoContent {
  if (raw == null) return defaultSiteSeoContent()
  const r = siteSeoSchema.safeParse(raw)
  if (!r.success) return defaultSiteSeoContent()
  return {
    globalDefaults: r.data.globalDefaults,
    staticPages: r.data.staticPages,
    marketingTools: r.data.marketingTools ?? [],
    technical: r.data.technical ?? {},
  }
}

function parseStored(raw: string | null): SiteSeoContent {
  if (!raw) return defaultSiteSeoContent()
  try {
    const v = siteSeoSchema.parse(JSON.parse(raw))
    return {
      globalDefaults: v.globalDefaults,
      staticPages: v.staticPages,
      marketingTools: v.marketingTools ?? [],
      technical: v.technical ?? {},
    }
  } catch {
    return defaultSiteSeoContent()
  }
}

export function getSiteSeoContent(): SiteSeoContent {
  if (!isBrowser()) return defaultSiteSeoContent()
  try {
    return parseStored(window.localStorage.getItem(SITE_SEO_STORAGE_KEY))
  } catch {
    return defaultSiteSeoContent()
  }
}

function stampSiteSeoForPersist(next: SiteSeoContent): SiteSeoContent {
  const parsed = siteSeoSchema.parse({
    globalDefaults: next.globalDefaults,
    staticPages: sanitizeStaticPagesLoose(next.staticPages),
  })
  return {
    globalDefaults: parsed.globalDefaults,
    staticPages: parsed.staticPages,
    marketingTools: parsed.marketingTools ?? [],
    technical: parsed.technical ?? {},
  }
}

function writeSiteSeoRaw(json: string): void {
  if (!isBrowser()) return
  window.localStorage.setItem(SITE_SEO_STORAGE_KEY, json)
  notifySiteSeoChange()
}

export function saveSiteSeoContent(next: SiteSeoContent): SiteSeoContent {
  const safe = stampSiteSeoForPersist(next)
  if (!isBrowser()) return safe
  try {
    writeSiteSeoRaw(JSON.stringify(safe))
    if (import.meta.env.MODE !== 'test') {
      void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
        m.scheduleAdminCmsRemoteSync(),
      )
    }
  } catch {
    /* */
  }
  return safe
}

/** Persist site SEO locally, then immediately flush to Supabase when configured. */
export async function saveSiteSeoContentAsync(
  next: SiteSeoContent,
): Promise<SiteSeoContent> {
  const safe = stampSiteSeoForPersist(next)
  try {
    writeSiteSeoRaw(JSON.stringify(safe))
  } catch {
    /* */
  }
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) {
    throw new Error(sync.error)
  }
  return safe
}

export function saveSiteSeoPartial(patch: Partial<SiteSeoContent>): SiteSeoContent {
  const cur = getSiteSeoContent()
  return saveSiteSeoContent({
    globalDefaults: { ...cur.globalDefaults, ...patch.globalDefaults },
    staticPages: { ...cur.staticPages, ...patch.staticPages },
  })
}

export function saveStaticPageSeo(
  path: SiteStaticSeoPath,
  patch: SeoFieldPatch,
): SiteSeoContent {
  const cur = getSiteSeoContent()
  const prev = cur.staticPages[path] ?? {}
  return saveSiteSeoContent({
    ...cur,
    staticPages: { ...cur.staticPages, [path]: { ...prev, ...patch } },
  })
}

export function subscribeSiteSeoChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {}
  const wrapped = () => listener()
  siteSeoEvents?.addEventListener(SITE_SEO_CHANGE_EVENT, wrapped)
  const onStorage = (event: StorageEvent) => {
    if (event.key === SITE_SEO_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    siteSeoEvents?.removeEventListener(SITE_SEO_CHANGE_EVENT, wrapped)
    window.removeEventListener('storage', onStorage)
  }
}
