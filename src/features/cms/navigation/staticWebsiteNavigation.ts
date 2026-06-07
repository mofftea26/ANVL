import { createDefaultWebsiteLayout } from '@/features/cms/layout/websiteLayout.defaults'
import {
  buildWebsiteNavigation,
  type WebsiteNavigationContent,
} from '@/features/cms/navigation/websiteNavigation'

const STATIC_LAYOUT = createDefaultWebsiteLayout()

/**
 * Code-owned storefront chrome — header, footer, and mobile drawer links.
 * Never loaded from Supabase or CMS editors; only emblem may be overridden
 * at runtime from published asset slots.
 */
export function buildStaticWebsiteNavigation(opts?: {
  emblemSrc?: string
  emblemAlt?: string
}): WebsiteNavigationContent {
  return buildWebsiteNavigation(STATIC_LAYOUT, {
    emblemSrc: opts?.emblemSrc,
    emblemAlt: opts?.emblemAlt ?? 'ANVL',
  })
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
