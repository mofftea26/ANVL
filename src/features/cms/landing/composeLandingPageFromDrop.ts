import type {
  LandingNavigationContent,
  LandingPageCmsContent,
} from '@/features/cms/landing/landingPageCms.types'
import { LANDING_CMS_VERSION } from '@/features/cms/landing/landingCms.constants'
import type { Drop } from '@/features/drops/drop.types'
import {
  publicLandingActsFromDraftActs,
  publicLandingActsFromSequence,
  publicLandingActsHeroSlotOnly,
} from '@/features/cms/landing/landingActs.normalize'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'

function patchDropHref(href: string, slug: string): string {
  const h = href.trim()
  if (h.startsWith('/drop/')) return `/drop/${slug}`
  return href
}

/** Header/footer/mobile nav: `/drop/*` targets active slug and public title. */
function patchDropNavLinks<T extends { href: string; label: string }>(
  links: T[],
  drop: Drop,
): T[] {
  return links.map((link) =>
    link.href.trim().startsWith('/drop/')
      ? {
          ...link,
          href: patchDropHref(link.href, drop.slug),
          label: drop.title,
        }
      : link,
  )
}

export type ComposeLandingPageFromDropOptions = {
  /**
   * Drop editor live preview: `landingActs` come **only** from `Drop.acts` (acts builder).
   * Empty acts yield an empty `landingActs` array (no `landingActSequence` merge).
   */
  editorActsPreview?: boolean
  /**
   * When paired with `editorActsPreview`: if there are no persisted acts, or every
   * act is disabled, compose a **single hero** row from the canonical homepage slot
   * sequence (same shape as Drop 01 hero) so the iframe preview is never blank.
   */
  editorPreviewHeroFallback?: boolean
  /**
   * Prefer `drop.acts` when non-empty, else fall back to `landingActSequence`
   * (homepage-style merge for tools/tests — not used by the drop editor preview).
   */
  useDraftActsPipeline?: boolean
}

export function composeLandingPageFromDrop(
  drop: Drop,
  layout: WebsiteLayoutContent,
  options?: ComposeLandingPageFromDropOptions,
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
    dropActs: [...drop.acts],
    landingActs: (() => {
      if (options?.editorActsPreview) {
        const acts = publicLandingActsFromDraftActs(drop.acts) ?? []
        const anyEnabled = acts.some((a) => a.enabled !== false)
        if (
          options.editorPreviewHeroFallback &&
          (acts.length === 0 || !anyEnabled)
        ) {
          return publicLandingActsHeroSlotOnly()
        }
        return acts
      }
      const fromActs = publicLandingActsFromDraftActs(drop.acts)
      if (fromActs && fromActs.length > 0) return fromActs
      return publicLandingActsFromSequence(drop.landingActSequence)
    })(),
  }
}
