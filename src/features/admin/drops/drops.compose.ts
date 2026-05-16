import type {
  LandingNavigationContent,
  LandingPageCmsContent,
} from '@/features/admin/landing-cms/landingCms.types'
import { LANDING_CMS_VERSION } from '@/features/admin/landing-cms/landingCms.defaults'
import type { Drop } from './drops.types'
import { publicLandingActsFromSequence } from '@/features/admin/drops/acts/landingActs.normalize'
import type { WebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.types'

function patchDropHref(href: string, slug: string): string {
  if (href.startsWith('/drop/')) return `/drop/${slug}`
  return href
}

/** Header/footer/mobile nav: `/drop/*` targets active slug and public title. */
function patchDropNavLinks<T extends { href: string; label: string }>(
  links: T[],
  drop: Drop,
): T[] {
  return links.map((link) =>
    link.href.startsWith('/drop/')
      ? {
          ...link,
          href: patchDropHref(link.href, drop.slug),
          label: drop.title,
        }
      : link,
  )
}

export function composeLandingPageFromDrop(
  drop: Drop,
  layout: WebsiteLayoutContent,
): LandingPageCmsContent {
  const lc = drop.landingContent

  const flatFooterLinks = layout.footer.linkGroups.flatMap((g) =>
    g.links.filter((l) => l.isVisible !== false),
  )

  const navigation: LandingNavigationContent = {
    headerLinks: patchDropNavLinks(layout.header.headerLinks, drop),
    footerLinks: patchDropNavLinks(flatFooterLinks, drop),
    footerTagline: layout.footer.tagline,
    footerMicroCaption: layout.footer.microCaption,
    newsletterTitle: layout.footer.newsletterTitle,
    newsletterPlaceholder: layout.footer.newsletterPlaceholder,
    newsletterButtonText: layout.footer.newsletterButtonText,
    headerLogoSrc: layout.header.logoStackedSrc,
    footerLogoSrc: layout.footer.logoStackedSrc,
    cartVisible: layout.header.cartVisible,
    announcement: layout.header.announcement,
    footerLinkGroups: layout.footer.linkGroups.map((g) => ({
      ...g,
      links: patchDropNavLinks(g.links, drop),
    })),
    activeDropEmblemSrc: drop.visuals.emblemImageUrl,
    activeDropEmblemAlt: drop.visuals.emblemAlt,
    footerDecorativeEmblemFallbackSrc:
      layout.footer.decorativeEmblemFallbackSrc,
    copyrightSuffix: layout.footer.copyrightText,
    socialLinks: layout.footer.socialLinks,
    mobileExtraLinks: patchDropNavLinks(layout.header.mobileExtraLinks, drop),
  }

  return {
    version: LANDING_CMS_VERSION,
    updatedAt: drop.updatedAt,
    seo: {
      title: drop.seo.title,
      description: drop.seo.description,
      path: '/',
      ogTitle: drop.seo.ogTitle ?? drop.seo.title,
      ogDescription: drop.seo.ogDescription ?? drop.seo.description,
      ogImage: drop.seo.ogImage,
    },
    navigation,
    hero: {
      ...lc.hero,
      primaryCta: {
        ...lc.hero.primaryCta,
        href: patchDropHref(lc.hero.primaryCta.href, drop.slug),
      },
      secondaryCta: { ...lc.hero.secondaryCta },
    },
    manifesto: lc.manifesto,
    dropReveal: {
      ...lc.dropReveal,
      primaryCta: {
        ...lc.dropReveal.primaryCta,
        href: patchDropHref(lc.dropReveal.primaryCta.href, drop.slug),
      },
      secondaryCta: {
        ...lc.dropReveal.secondaryCta,
        href: patchDropHref(lc.dropReveal.secondaryCta.href, drop.slug),
      },
      dropIcon: {
        src: drop.visuals.emblemImageUrl,
        alt: drop.visuals.emblemAlt,
      },
    },
    pieces: {
      ...lc.pieces,
      viewAllHref: patchDropHref(lc.pieces.viewAllHref, drop.slug),
      footerLinkHref: patchDropHref(lc.pieces.footerLinkHref, drop.slug),
    },
    materials: lc.materials,
    waitlist: lc.waitlist,
    landingActs: publicLandingActsFromSequence(drop.landingActSequence),
  }
}
