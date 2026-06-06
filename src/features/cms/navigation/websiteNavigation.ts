import type { LandingNavigationContent } from '@/features/cms/navigation/navigation.types'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'

/**
 * Builds the storefront header/footer navigation from the website layout alone —
 * no drop dependency. Replaces the navigation slice of the deprecated
 * `composeLandingPageFromDrop`. The optional emblem comes from global brand
 * settings (not a drop).
 *
 * `LandingNavigationContent` is the stable nav contract consumed by `PremiumNav`
 * and `SiteFooter`; it is re-exported from a drop-free location so the landing
 * CMS types can be removed in the teardown.
 */
export function buildWebsiteNavigation(
  layout: WebsiteLayoutContent,
  opts?: { emblemSrc?: string; emblemAlt?: string },
): LandingNavigationContent {
  const flatFooterLinks = layout.footer.linkGroups.flatMap((g) =>
    g.links.filter((l) => l.isVisible !== false),
  )

  return {
    headerLinks: layout.header.headerLinks,
    footerLinks: flatFooterLinks,
    footerTagline: layout.footer.tagline,
    footerMicroCaption: layout.footer.microCaption,
    newsletterTitle: layout.footer.newsletterTitle,
    newsletterPlaceholder: layout.footer.newsletterPlaceholder,
    newsletterButtonText: layout.footer.newsletterButtonText,
    headerLogoSrc: layout.header.logoStackedSrc,
    footerLogoSrc: layout.footer.logoStackedSrc,
    cartVisible: layout.header.cartVisible,
    announcement: layout.header.announcement,
    footerLinkGroups: layout.footer.linkGroups,
    activeDropEmblemSrc: opts?.emblemSrc,
    activeDropEmblemAlt: opts?.emblemAlt,
    footerDecorativeEmblemFallbackSrc: layout.footer.decorativeEmblemFallbackSrc,
    copyrightSuffix: layout.footer.copyrightText,
    socialLinks: layout.footer.socialLinks,
    mobileExtraLinks: layout.header.mobileExtraLinks,
  }
}

export type { LandingNavigationContent as WebsiteNavigationContent }
