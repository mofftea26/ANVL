export type DropStatus = 'draft' | 'active' | 'inactive' | 'archived'

export type DropThemePalette = {
  id: string
  name: string
  colors: {
    background: string
    surface: string
    surfaceSoft: string
    heading: string
    text: string
    mutedText: string
    line: string
    accent: string
    accentSoft: string
    heroGlow: string
    danger?: string
    success?: string
  }
}

export type DropVisuals = {
  emblemImageUrl: string
  emblemAlt: string
  logoImageUrl?: string
  wordmarkImageUrl?: string
  loadingEmblemUrl?: string
}

export type DropLandingContent = {
  hero: {
    actLabel: string
    badgeText: string
    title: string
    subtitle: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
    meta: Array<{ id: string; label: string; value: string }>
  }
  manifesto: {
    actLabel: string
    counterLabel: string
    heading: string
    intro: string
    tenets: Array<{ id: string; text: string; isVisible: boolean }>
  }
  dropReveal: {
    actLabel: string
    counterLabel: string
    words: string[]
    tagline: string
    stats: Array<{ id: string; label: string; value: string }>
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
  }
  pieces: {
    actLabel: string
    headingLineOne: string
    headingLineTwo: string
    viewAllLabel: string
    viewAllHref: string
    footerLeftText: string
    footerLinkLabel: string
    footerLinkHref: string
  }
  materials: {
    actLabel: string
    counterSuffix: string
    heading: string
    intro: string
    materials: Array<{
      id: string
      code: string
      title: string
      description: string
      isFeatured: boolean
      isVisible: boolean
    }>
  }
  waitlist: {
    actLabel: string
    rightLabel: string
    heading: string
    intro: string
    bullets: Array<{ id: string; text: string; isVisible: boolean }>
    form: {
      emailLabel: string
      emailPlaceholder: string
      firstNameLabel: string
      firstNamePlaceholder: string
      preferredProductLabel: string
      preferredProductPlaceholder: string
      submitLabel: string
      submittingLabel: string
      successToast: string
    }
  }
}

export type DropSeo = {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

export type Drop = {
  id: string
  slug: string
  name: string
  dropNumber: string
  title: string
  subtitle: string
  description: string
  status: DropStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
  theme: DropThemePalette
  visuals: DropVisuals
  landingContent: DropLandingContent
  productIds: string[]
  seo: DropSeo
}

export type DropsPersistedState = {
  drops: Drop[]
}
