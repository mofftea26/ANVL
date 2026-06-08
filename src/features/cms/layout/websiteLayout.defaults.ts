import { navigationDefaults } from '@/features/cms/navigation/navigation.defaults'
import { DEFAULT_EMBLEM_SRC } from '@/shared/constants/brandAssets'
import type { WebsiteLayoutContent } from '@/features/cms/layout/websiteLayout.types'

export const WEBSITE_LAYOUT_VERSION = 1

export function createDefaultWebsiteLayout(
  nowIso = new Date().toISOString(),
): WebsiteLayoutContent {
  const nav = navigationDefaults
  return {
    version: WEBSITE_LAYOUT_VERSION,
    updatedAt: nowIso,
    header: {
      cartVisible: true,
      announcement: { enabled: false, message: '', href: '' },
      headerLinks: nav.headerLinks.map((l) => ({ ...l })),
      mobileExtraLinks: [],
    },
    footer: {
      decorativeEmblemFallbackSrc: DEFAULT_EMBLEM_SRC,
      tagline: nav.footerTagline,
      microCaption: nav.footerMicroCaption,
      linkGroups: [
        {
          id: 'footer-main',
          title: undefined,
          links: nav.footerLinks.map((l) => ({ ...l })),
        },
      ],
      newsletterTitle: nav.newsletterTitle,
      newsletterPlaceholder: nav.newsletterPlaceholder,
      newsletterButtonText: nav.newsletterButtonText,
      socialLinks: [
        { id: 'soc-ig', label: 'Instagram', href: '#' },
        { id: 'soc-tt', label: 'TikTok', href: '#' },
      ],
      copyrightText: 'ANVL Athletics. All rights reserved.',
    },
  }
}
