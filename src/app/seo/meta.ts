import { BRAND } from '@/shared/constants/brand'

export interface SeoInput {
  title: string
  description: string
  path: string
  canonicalUrl?: string
  image?: string
  noIndex?: boolean
  ogTitle?: string
  ogDescription?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

export function normalizePath(path: string): string {
  if (!path) return '/'
  const p = path.startsWith('/') ? path : `/${path}`
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p
}

export function resolveCanonical(input: {
  path: string
  canonicalUrl?: string
  baseUrl?: string
}): string {
  const base = input.baseUrl ?? BRAND.canonicalBaseUrl
  const c = input.canonicalUrl?.trim()
  if (c) {
    if (c.startsWith('http://') || c.startsWith('https://')) return c
    const rel = c.startsWith('/') ? c : `/${c}`
    return `${base}${rel}`
  }
  return `${base}${normalizePath(input.path)}`
}

export function resolveAssetUrl(
  src: string | undefined,
  baseUrl: string = BRAND.canonicalBaseUrl,
): string | undefined {
  if (!src?.trim()) return undefined
  const t = src.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  const rel = t.startsWith('/') ? t : `/${t}`
  return `${baseUrl}${rel}`
}

export function buildSeoMeta(input: SeoInput) {
  const canonical = resolveCanonical({
    path: input.path,
    canonicalUrl: input.canonicalUrl,
  })
  const ogImage =
    resolveAssetUrl(input.image) ??
    `${BRAND.canonicalBaseUrl}/brand/og-default.svg`
  const title = input.title
  const description = input.description
  const ogTitle = input.ogTitle?.trim() || title
  const ogDescription = input.ogDescription?.trim() || description
  const twitterTitle = input.twitterTitle?.trim() || ogTitle
  const twitterDescription = input.twitterDescription?.trim() || ogDescription
  const twitterImage = resolveAssetUrl(input.twitterImage) ?? ogImage
  const robots = input.noIndex ? 'noindex,nofollow' : 'index,follow'

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: robots },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: ogDescription },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: ogImage },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: twitterTitle },
      { name: 'twitter:description', content: twitterDescription },
      { name: 'twitter:image', content: twitterImage },
    ],
    links: [{ rel: 'canonical', href: canonical }],
  }
}
