import type { CmsLinkItem } from './navigation.types'

/**
 * Drop-free seed navigation defaults.
 *
 * Previously the website-layout seed pulled its header/footer links from
 * `admin/landing-cms/landingCms.defaults` (part of the drop-builder delete set,
 * whose header link pointed at `/drop/the-oath`). These defaults are the stable,
 * storefront-safe replacement: the campaign link is now a plain "Story" entry
 * (`/story`).
 *
 * Care Guide and Size Guide live in the footer's "Support" group (and are
 * cross-linked contextually from the PDP size selector + bento) rather than
 * the header topbar — matches how premium storefronts (Nike, Gymshark, etc.)
 * keep the top nav to primary shopping links only.
 */
export interface NavigationDefaults {
  headerLinks: CmsLinkItem[]
  /** Flat fallback — kept for adapters/tests that read a single link list. */
  footerLinks: CmsLinkItem[]
  footerLinkGroups: { id: string; title?: string; links: CmsLinkItem[] }[]
  footerTagline: string
  footerMicroCaption: string
  newsletterTitle: string
  newsletterPlaceholder: string
  newsletterButtonText: string
}

const footerShopLinks: CmsLinkItem[] = [
  { id: 'footer-shop', label: 'Shop', href: '/shop', isVisible: true },
  { id: 'footer-story', label: 'Story', href: '/story', isVisible: true },
  { id: 'footer-about', label: 'About', href: '/about', isVisible: true },
]

const footerSupportLinks: CmsLinkItem[] = [
  { id: 'footer-care-guide', label: 'Care Guide', href: '/care-guide', isVisible: true },
  { id: 'footer-size-guide', label: 'Size Guide', href: '/size-guide', isVisible: true },
  { id: 'footer-faq', label: 'FAQ', href: '/faq', isVisible: true },
  { id: 'footer-contact', label: 'Contact', href: '/contact', isVisible: true },
  { id: 'footer-returns', label: 'Returns', href: '/returns', isVisible: true },
]

const footerLegalLinks: CmsLinkItem[] = [
  { id: 'footer-privacy', label: 'Privacy Policy', href: '/privacy', isVisible: true },
  { id: 'footer-terms', label: 'Terms of Service', href: '/terms', isVisible: true },
  { id: 'footer-cookie-policy', label: 'Cookie Policy', href: '/cookie-policy', isVisible: true },
]

export const navigationDefaults: NavigationDefaults = {
  headerLinks: [
    { id: 'nav-shop', label: 'Shop', href: '/shop', isVisible: true },
    { id: 'nav-story', label: 'Story', href: '/story', isVisible: true },
    { id: 'nav-about', label: 'About', href: '/about', isVisible: true },
  ],
  footerLinks: [...footerShopLinks, ...footerSupportLinks, ...footerLegalLinks],
  footerLinkGroups: [
    { id: 'footer-group-shop', title: 'Shop', links: footerShopLinks },
    { id: 'footer-group-support', title: 'Support', links: footerSupportLinks },
    { id: 'footer-group-legal', title: 'Legal', links: footerLegalLinks },
  ],
  footerTagline: 'Premium bodybuilding gymwear for serious lifters.',
  footerMicroCaption: 'Forged Under Pressure',
  newsletterTitle: 'Newsletter',
  newsletterPlaceholder: 'Email address',
  newsletterButtonText: 'Join',
}
