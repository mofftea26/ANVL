import type { CmsLinkItem } from './navigation.types'

/**
 * Drop-free seed navigation defaults.
 *
 * Previously the website-layout seed pulled its header/footer links from
 * `admin/landing-cms/landingCms.defaults` (part of the drop-builder delete set,
 * whose header link pointed at `/drop/the-oath`). These defaults are the stable,
 * storefront-safe replacement: the campaign link is now a plain "Story" entry
 * (`/story`), with a sibling "Care Guide" entry (`/care-guide`) in header + footer.
 */
export interface NavigationDefaults {
  headerLinks: CmsLinkItem[]
  footerLinks: CmsLinkItem[]
  footerTagline: string
  footerMicroCaption: string
  newsletterTitle: string
  newsletterPlaceholder: string
  newsletterButtonText: string
}

export const navigationDefaults: NavigationDefaults = {
  headerLinks: [
    { id: 'nav-shop', label: 'Shop', href: '/shop', isVisible: true },
    { id: 'nav-story', label: 'Story', href: '/story', isVisible: true },
    { id: 'nav-about', label: 'About', href: '/about', isVisible: true },
    {
      id: 'nav-care-guide',
      label: 'Care Guide',
      href: '/care-guide',
      isVisible: true,
    },
    {
      id: 'nav-size-guide',
      label: 'Size Guide',
      href: '/size-guide',
      isVisible: true,
    },
  ],
  footerLinks: [
    { id: 'footer-shop', label: 'Shop', href: '/shop', isVisible: true },
    { id: 'footer-story', label: 'Story', href: '/story', isVisible: true },
    { id: 'footer-about', label: 'About', href: '/about', isVisible: true },
    {
      id: 'footer-care-guide',
      label: 'Care Guide',
      href: '/care-guide',
      isVisible: true,
    },
    {
      id: 'footer-size-guide',
      label: 'Size Guide',
      href: '/size-guide',
      isVisible: true,
    },
    { id: 'footer-returns', label: 'Returns', href: '/returns', isVisible: true },
  ],
  footerTagline: 'Premium bodybuilding gymwear for serious lifters.',
  footerMicroCaption: 'Forged Under Pressure',
  newsletterTitle: 'Newsletter',
  newsletterPlaceholder: 'Email address',
  newsletterButtonText: 'Join',
}
