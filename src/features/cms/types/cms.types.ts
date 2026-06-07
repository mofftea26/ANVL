export const SEO_STRUCTURED_DATA_TYPES = [
  'Organization',
  'Product',
  'CollectionPage',
  'WebPage',
  'BreadcrumbList',
] as const

export type SeoStructuredDataType = (typeof SEO_STRUCTURED_DATA_TYPES)[number]

export interface SeoContent {
  title: string
  description: string
  canonicalPath: string
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
  structuredDataType?: SeoStructuredDataType
}

export type SeoFieldPatch = Partial<SeoContent>

export type StorefrontCampaign = {
  id: string
  title: string
  description: string
}

export type StorefrontLookbookItem = {
  id: string
  alt: string
  src: string
}


export interface HomePageContent {
  hero: {
    title: string
    subtitle: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
  }
  manifesto: {
    heading: string
    lines: string[]
  }
  materials: Array<{ title: string; description: string }>
}
