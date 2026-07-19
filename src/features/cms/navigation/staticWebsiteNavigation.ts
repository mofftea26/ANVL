import { createDefaultWebsiteLayout } from '@/features/cms/layout/websiteLayout.defaults'
import {
  buildWebsiteNavigation,
  type WebsiteNavigationContent,
} from '@/features/cms/navigation/websiteNavigation'
import type {
  CmsLinkItem,
  LandingFooterLinkGroup,
} from '@/features/cms/navigation/navigation.types'

const STATIC_LAYOUT = createDefaultWebsiteLayout()

/**
 * Footer links added here (not in the layout seed) so the two net-new content
 * pages surface in their natural groups: Shipping under Support, Accessibility
 * under Legal. Keyed to a group title so injection survives any seed reorder.
 */
const EXTRA_FOOTER_LINKS: { groupTitle: string; link: CmsLinkItem }[] = [
  {
    groupTitle: 'Support',
    link: { id: 'footer-shipping', label: 'Shipping', href: '/shipping', isVisible: true },
  },
  {
    groupTitle: 'Legal',
    link: { id: 'footer-accessibility', label: 'Accessibility', href: '/accessibility', isVisible: true },
  },
]

/** Appends the net-new links into their matching titled footer groups. */
function withExtraFooterLinks(nav: WebsiteNavigationContent): WebsiteNavigationContent {
  const groups: LandingFooterLinkGroup[] = (nav.footerLinkGroups ?? []).map((group) => {
    const extras = EXTRA_FOOTER_LINKS.filter(
      (e) => e.groupTitle.toLowerCase() === group.title?.trim().toLowerCase(),
    ).map((e) => e.link)
    return extras.length > 0 ? { ...group, links: [...group.links, ...extras] } : group
  })
  return {
    ...nav,
    footerLinkGroups: groups,
    footerLinks: groups.flatMap((group) => group.links),
  }
}

/**
 * Code-owned storefront chrome — header, footer, and mobile drawer links.
 * Never loaded from Supabase or CMS editors; only emblem may be overridden
 * at runtime from published asset slots.
 */
export function buildStaticWebsiteNavigation(opts?: {
  emblemSrc?: string
  emblemAlt?: string
}): WebsiteNavigationContent {
  return withExtraFooterLinks(
    buildWebsiteNavigation(STATIC_LAYOUT, {
      emblemSrc: opts?.emblemSrc,
      emblemAlt: opts?.emblemAlt ?? 'ANVL',
    }),
  )
}

/** Frozen nav links for adapters/tests (no emblem override). */
export const STATIC_WEBSITE_NAVIGATION = buildStaticWebsiteNavigation()

export function staticHeaderNavLinks() {
  return STATIC_WEBSITE_NAVIGATION.headerLinks.filter(
    (link) => link.isVisible !== false,
  )
}

export function staticFooterNavLinks() {
  return STATIC_WEBSITE_NAVIGATION.footerLinks.filter(
    (link) => link.isVisible !== false,
  )
}
