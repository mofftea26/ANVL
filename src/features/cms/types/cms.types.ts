export interface SeoContent {
  title: string
  description: string
  canonicalPath: string
  ogImage?: string
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
