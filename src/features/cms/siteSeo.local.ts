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

export type SiteSeoContent = {
  globalDefaults: SiteSeoGlobalDefaults
  staticPages: Partial<Record<SiteStaticSeoPath, SeoFieldPatch>>
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

const staticPathKey = z.enum(['/', '/shop', '/about', '/size-guide'])
const siteSeoSchema = z.object({
  globalDefaults: globalDefaultsSchema,
  staticPages: z.record(staticPathKey, patchSchema).optional(),
})

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
      defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg`,
    },
    staticPages: {},
  }
}

function parseStored(raw: string | null): SiteSeoContent {
  if (!raw) return defaultSiteSeoContent()
  try {
    const v = siteSeoSchema.parse(JSON.parse(raw))
    return { globalDefaults: v.globalDefaults, staticPages: v.staticPages ?? {} }
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

export function saveSiteSeoContent(next: SiteSeoContent): SiteSeoContent {
  const parsed = siteSeoSchema.parse({
    globalDefaults: next.globalDefaults,
    staticPages: next.staticPages ?? {},
  })
  const safe: SiteSeoContent = {
    globalDefaults: parsed.globalDefaults,
    staticPages: parsed.staticPages ?? {},
  }
  if (!isBrowser()) return safe
  try {
    window.localStorage.setItem(SITE_SEO_STORAGE_KEY, JSON.stringify(safe))
    notifySiteSeoChange()
  } catch {
    /* */
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
