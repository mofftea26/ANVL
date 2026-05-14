/**
 * Strongly-typed content model for the entire ANVL landing page.
 *
 * Every section of the public homepage reads from this shape. The
 * shape is intentionally serializable and string-heavy so it round-
 * trips cleanly through `localStorage` / JSON export. A real backend
 * replacement only needs to honor the same contract.
 */

import type { PublicLandingAct } from '@/features/admin/drops/acts/landingActs.types'
import type { SeoStructuredDataType } from '@/features/cms/types/cms.types'

export interface CmsCta {
  label: string
  href: string
}

export interface CmsLinkItem {
  id: string
  label: string
  href: string
  isVisible: boolean
}

export interface CmsMetaItem {
  id: string
  label: string
  value: string
}

export interface CmsTenetItem {
  id: string
  text: string
  isVisible: boolean
}

export interface CmsStatItem {
  id: string
  label: string
  value: string
}

export interface CmsMaterialItem {
  id: string
  code: string
  title: string
  description: string
  isFeatured: boolean
  isVisible: boolean
}

export interface CmsBulletItem {
  id: string
  text: string
  isVisible: boolean
}

export interface LandingSeoContent {
  title: string
  description: string
  path: string
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

export interface LandingSocialLink {
  id: string
  label: string
  href: string
}

export interface LandingFooterLinkGroup {
  id: string
  title?: string
  links: CmsLinkItem[]
}

export interface LandingAnnouncementBar {
  enabled: boolean
  message: string
  href?: string
}

export interface LandingNavigationContent {
  headerLinks: CmsLinkItem[]
  footerLinks: CmsLinkItem[]
  footerTagline: string
  footerMicroCaption: string
  newsletterTitle: string
  newsletterPlaceholder: string
  newsletterButtonText: string
  /** Runtime bridge fields — populated by drop system compose step */
  headerLogoSrc?: string
  footerLogoSrc?: string
  cartVisible?: boolean
  announcement?: LandingAnnouncementBar
  footerLinkGroups?: LandingFooterLinkGroup[]
  mobileExtraLinks?: CmsLinkItem[]
  activeDropEmblemSrc?: string
  activeDropEmblemAlt?: string
  footerDecorativeEmblemFallbackSrc?: string
  copyrightSuffix?: string
  socialLinks?: LandingSocialLink[]
}

export interface LandingHeroContent {
  actLabel: string
  badgeText: string
  title: string
  subtitle: string
  primaryCta: CmsCta
  secondaryCta: CmsCta
  meta: CmsMetaItem[]
}

export interface LandingManifestoContent {
  actLabel: string
  counterLabel: string
  heading: string
  intro: string
  tenets: CmsTenetItem[]
}

/**
 * Optional drop mark shown in Act III. `src` may be a path under
 * `public/` (e.g. `/brand/drop-icon.svg`), an absolute URL, or a
 * `data:image/...` payload from the admin file picker.
 */
export interface LandingDropIcon {
  src: string
  alt: string
}

export interface LandingDropRevealContent {
  actLabel: string
  counterLabel: string
  words: string[]
  tagline: string
  stats: CmsStatItem[]
  primaryCta: CmsCta
  secondaryCta: CmsCta
  dropIcon: LandingDropIcon
}

export interface LandingPiecesContent {
  actLabel: string
  headingLineOne: string
  headingLineTwo: string
  viewAllLabel: string
  viewAllHref: string
  footerLeftText: string
  footerLinkLabel: string
  footerLinkHref: string
}

export interface LandingMaterialsContent {
  actLabel: string
  counterSuffix: string
  heading: string
  intro: string
  materials: CmsMaterialItem[]
}

export interface LandingWaitlistFormContent {
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

export interface LandingWaitlistContent {
  actLabel: string
  rightLabel: string
  heading: string
  intro: string
  bullets: CmsBulletItem[]
  form: LandingWaitlistFormContent
}

export interface LandingPageCmsContent {
  version: number
  updatedAt: string
  seo: LandingSeoContent
  navigation: LandingNavigationContent
  hero: LandingHeroContent
  manifesto: LandingManifestoContent
  dropReveal: LandingDropRevealContent
  pieces: LandingPiecesContent
  materials: LandingMaterialsContent
  waitlist: LandingWaitlistContent
  landingActs: PublicLandingAct[]
}

export type LandingCmsSectionKey = Exclude<
  keyof LandingPageCmsContent,
  'version' | 'updatedAt' | 'landingActs'
>
