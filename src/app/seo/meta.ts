import { BRAND } from '@/shared/constants/brand'

interface SeoInput {
  title: string
  description: string
  path: string
  image?: string
  /** Open Graph / Twitter title; defaults to `title`. */
  ogTitle?: string
  /** Open Graph / Twitter description; defaults to `description`. */
  ogDescription?: string
}

export function buildSeoMeta(input: SeoInput) {
  const canonical = `${BRAND.canonicalBaseUrl}${input.path}`
  const image = input.image ?? `${BRAND.canonicalBaseUrl}/brand/og-default.svg`
  const ogTitle = input.ogTitle?.trim() || input.title
  const ogDescription = input.ogDescription?.trim() || input.description
  return {
    title: input.title,
    meta: [
      { name: 'description', content: input.description },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: ogDescription },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: ogTitle },
      { name: 'twitter:description', content: ogDescription },
      { name: 'twitter:image', content: image },
    ],
    links: [{ rel: 'canonical', href: canonical }],
  }
}
