import { BRAND } from '@/shared/constants/brand'

interface SeoInput {
  title: string
  description: string
  path: string
  image?: string
}

export function buildSeoMeta(input: SeoInput) {
  const canonical = `${BRAND.canonicalBaseUrl}${input.path}`
  const image = input.image ?? `${BRAND.canonicalBaseUrl}/brand/og-default.svg`
  return {
    title: input.title,
    meta: [
      { name: 'description', content: input.description },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: input.title },
      { property: 'og:description', content: input.description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: input.title },
      { name: 'twitter:description', content: input.description },
      { name: 'twitter:image', content: image },
    ],
    links: [{ rel: 'canonical', href: canonical }],
  }
}
