import type { LandingActSlot } from '@/features/drops/drops.actSequence'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import type { SeoStructuredDataType } from '@/features/cms/types/cms.types'
import type { DropThemePalette } from '@/features/drops/theme/dropThemePalette.types'

export type { LandingActSlotKey, LandingActSlot } from '@/features/drops/drops.actSequence'
export type { DropThemePalette }
export {
  LANDING_ACT_SLOT_KEYS,
  defaultLandingActSequence,
  normalizeLandingActSequence,
} from '@/features/drops/drops.actSequence'

export type DropStatus =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'scheduled'
  | 'archived'

export type DropVisuals = {
  emblemImageUrl: string
  emblemAlt: string
  /** Optional backdrop for the public `/drop/:slug` hero. */
  heroImageUrl?: string
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
  /** ISO date or datetime — campaign release label. */
  releaseDate?: string
  /** ISO datetime — planned activation (admin scheduling only; no auto job yet). */
  scheduledActivationAt?: string
  createdAt: string
  updatedAt: string
  theme: DropThemePalette
  visuals: DropVisuals
  landingContent: DropLandingContent
  landingActSequence: LandingActSlot[]
  acts: LandingAct[]
  productIds: string[]
  seo: DropSeo
}

export type DropsPersistedState = {
  drops: Drop[]
}
