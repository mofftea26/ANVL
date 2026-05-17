import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoMeta,
  resolveAssetUrl,
  type SeoInput,
} from '@/app/seo/meta'
import type { SeoContent } from '@/features/cms/types/cms.types'
import type { DropSeo } from '@/features/admin/drops/drops.types'
import type { LandingSeoContent } from '@/features/cms/landing/landingPageCms.types'
import type { SiteSeoGlobalDefaults } from '@/features/cms/siteSeo.local'

export type { SiteSeoGlobalDefaults } from '@/features/cms/siteSeo.local'

export type CmsSeoMetaSource = {
  metaTitle?: string
  metaDescription?: string
  path: string
  canonicalUrl?: string
  noIndex?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

export type SeoWarning = { code: string; message: string; severity: 'info' | 'warn' }

function pickStr(...vals: (string | undefined)[]): string | undefined {
  for (const v of vals) {
    const t = v?.trim()
    if (t) return t
  }
  return undefined
}

export function computeSeoWarnings(input: {
  metaTitle: string
  metaDescription: string
}): SeoWarning[] {
  const w: SeoWarning[] = []
  const t = input.metaTitle.trim()
  const d = input.metaDescription.trim()
  if (!t) w.push({ code: 'title-empty', message: 'Meta title is empty.', severity: 'warn' })
  else if (t.length > 60)
    w.push({
      code: 'title-long',
      message: `Meta title is long (${t.length} chars). SERP previews often truncate near 60.`,
      severity: 'info',
    })
  if (!d)
    w.push({ code: 'desc-empty', message: 'Meta description is empty.', severity: 'warn' })
  else if (d.length > 160)
    w.push({
      code: 'desc-long',
      message: `Meta description is long (${d.length} chars). Snippets often clip near 155–160.`,
      severity: 'info',
    })
  return w
}

export function landingSeoToMetaSource(
  seo: LandingSeoContent,
  global: SiteSeoGlobalDefaults | undefined,
): CmsSeoMetaSource {
  const g = global ?? {}
  const path = seo.path?.trim() || '/'
  return {
    metaTitle: pickStr(seo.metaTitle, seo.title, g.metaTitle),
    metaDescription: pickStr(seo.metaDescription, seo.description, g.metaDescription),
    path,
    canonicalUrl: pickStr(seo.canonicalUrl, g.canonicalUrl),
    noIndex: seo.noIndex ?? g.noIndex,
    ogTitle: pickStr(seo.ogTitle, g.ogTitle),
    ogDescription: pickStr(seo.ogDescription, g.ogDescription),
    ogImage: pickStr(seo.ogImage, g.ogImage, g.defaultShareImage),
    twitterTitle: pickStr(seo.twitterTitle, g.twitterTitle),
    twitterDescription: pickStr(seo.twitterDescription, g.twitterDescription),
    twitterImage: pickStr(seo.twitterImage, g.twitterImage),
  }
}

export function dropSeoToMetaSource(
  seo: DropSeo,
  path: string,
  global: SiteSeoGlobalDefaults | undefined,
): CmsSeoMetaSource {
  const g = global ?? {}
  return {
    metaTitle: pickStr(seo.metaTitle, seo.title, g.metaTitle),
    metaDescription: pickStr(seo.metaDescription, seo.description, g.metaDescription),
    path,
    canonicalUrl: pickStr(seo.canonicalUrl, g.canonicalUrl),
    noIndex: seo.noIndex ?? g.noIndex,
    ogTitle: pickStr(seo.ogTitle, g.ogTitle),
    ogDescription: pickStr(seo.ogDescription, g.ogDescription),
    ogImage: pickStr(seo.ogImage, g.ogImage, g.defaultShareImage),
    twitterTitle: pickStr(seo.twitterTitle, g.twitterTitle),
    twitterDescription: pickStr(seo.twitterDescription, g.twitterDescription),
    twitterImage: pickStr(seo.twitterImage, g.twitterImage),
  }
}

export function productSeoToMetaSource(input: {
  name: string
  storytelling: string
  slug: string
  seo: {
    title?: string
    description?: string
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
  }
  global: SiteSeoGlobalDefaults | undefined
}): CmsSeoMetaSource {
  const g = input.global ?? {}
  const title =
    pickStr(input.seo.metaTitle, input.seo.title, input.name, g.metaTitle) ?? input.name
  const desc =
    pickStr(
      input.seo.metaDescription,
      input.seo.description,
      input.storytelling,
      g.metaDescription,
    ) ?? ''
  return {
    metaTitle: title,
    metaDescription: desc,
    path: `/shop/${input.slug}`,
    canonicalUrl: pickStr(input.seo.canonicalUrl, g.canonicalUrl),
    noIndex: input.seo.noIndex ?? g.noIndex,
    ogTitle: pickStr(input.seo.ogTitle, g.ogTitle),
    ogDescription: pickStr(input.seo.ogDescription, g.ogDescription),
    ogImage: pickStr(input.seo.ogImage, g.ogImage, g.defaultShareImage),
    twitterTitle: pickStr(input.seo.twitterTitle, g.twitterTitle),
    twitterDescription: pickStr(input.seo.twitterDescription, g.twitterDescription),
    twitterImage: pickStr(input.seo.twitterImage, g.twitterImage),
  }
}

export function seoContentToMetaSource(
  doc: SeoContent,
  global: SiteSeoGlobalDefaults | undefined,
): CmsSeoMetaSource {
  const g = global ?? {}
  const path = doc.canonicalPath?.trim() ? doc.canonicalPath : '/'
  return {
    metaTitle: pickStr(doc.metaTitle, doc.title, g.metaTitle),
    metaDescription: pickStr(doc.metaDescription, doc.description, g.metaDescription),
    path: path.startsWith('/') ? path : `/${path}`,
    canonicalUrl: pickStr(doc.canonicalUrl, g.canonicalUrl),
    noIndex: doc.noIndex ?? g.noIndex,
    ogTitle: pickStr(doc.ogTitle, g.ogTitle),
    ogDescription: pickStr(doc.ogDescription, g.ogDescription),
    ogImage: pickStr(doc.ogImage, g.ogImage, g.defaultShareImage),
    twitterTitle: pickStr(doc.twitterTitle, g.twitterTitle),
    twitterDescription: pickStr(doc.twitterDescription, g.twitterDescription),
    twitterImage: pickStr(doc.twitterImage, g.twitterImage),
  }
}

export function buildSeoMetaFromCmsSource(
  page: CmsSeoMetaSource,
  global: SiteSeoGlobalDefaults | undefined,
): ReturnType<typeof buildSeoMeta> {
  const g = global ?? {}
  const title =
    pickStr(page.metaTitle, g.metaTitle) ?? 'ANVL Athletics | Forged Under Pressure'
  const description =
    pickStr(page.metaDescription, g.metaDescription) ??
    'Premium bodybuilding gymwear built for disciplined lifters.'
  const shareFallback =
    resolveAssetUrl(g.defaultShareImage?.trim()) ??
    `${BRAND.canonicalBaseUrl}/brand/og-default.svg`
  const image =
    resolveAssetUrl(pickStr(page.ogImage, g.ogImage, g.defaultShareImage)) ?? shareFallback

  const input: SeoInput = {
    title,
    description,
    path: page.path || '/',
    canonicalUrl: pickStr(page.canonicalUrl, g.canonicalUrl),
    image,
    noIndex: page.noIndex ?? g.noIndex,
    ogTitle: pickStr(page.ogTitle, g.ogTitle),
    ogDescription: pickStr(page.ogDescription, g.ogDescription),
    twitterTitle: pickStr(page.twitterTitle, g.twitterTitle),
    twitterDescription: pickStr(page.twitterDescription, g.twitterDescription),
    twitterImage: pickStr(page.twitterImage, g.twitterImage),
  }

  return buildSeoMeta(input)
}
