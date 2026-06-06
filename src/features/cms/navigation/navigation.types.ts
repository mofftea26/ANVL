/**
 * Stable storefront navigation contract — the shape consumed by `PremiumNav`,
 * `StickyHeader`, and `SiteFooter`, built from the website layout by
 * {@link buildWebsiteNavigation}.
 *
 * These types previously lived in the (deprecated) `cms/landing/landingPageCms.types`
 * alongside the drop-builder content model. They were relocated here so the
 * landing/act types can be removed without touching the storefront chrome.
 */

export interface CmsLinkItem {
  id: string
  label: string
  href: string
  isVisible: boolean
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
  /** Runtime bridge fields — populated by the website-layout compose step. */
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
