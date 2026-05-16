import { BRAND } from '@/shared/constants/brand'

interface SeoInput {
  title: string
  description: string
  path: string
  /** Full canonical URL when CMS provides an absolute override. */
  canonicalUrl?: string
  image?: string
  noIndex?: boolean
  /** Open Graph / Twitter title; defaults to `title`. */
  ogTitle?: string
  /** Open Graph / Twitter description; defaults to `description`. */
  ogDescription?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

export function buildSeoMeta(input: SeoInput) {
  const pathNorm = input.path.startsWith('/') ? input.path : `/${input.path}`
  const canonical =
    input.canonicalUrl?.trim() || `${BRAND.canonicalBaseUrl}${pathNorm}`
  const image = input.image ?? `${BRAND.canonicalBaseUrl}/brand/og-default.svg`
  const ogTitle = input.ogTitle?.trim() || input.title
  const ogDescription = input.ogDescription?.trim() || input.description
  const twTitle = input.twitterTitle?.trim() || ogTitle
  const twDesc = input.twitterDescription?.trim() || ogDescription
  const twImg = input.twitterImage ?? image
  const robots = input.noIndex ? 'noindex,nofollow' : 'index,follow'
  return {
    title: input.title,
    meta: [
      { name: 'description', content: input.description },
      { name: 'robots', content: robots },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: ogDescription },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: twTitle },
      { name: 'twitter:description', content: twDesc },
      { name: 'twitter:image', content: twImg },
    ],
    links: [{ rel: 'canonical', href: canonical }],
  }
}
