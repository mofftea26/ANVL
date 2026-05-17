import type { CmsLinkItem } from '@/features/cms/landing/landingPageCms.types'

export type WebsiteFooterLinkGroup = {
  id: string
  title?: string
  links: CmsLinkItem[]
}

export type WebsiteSocialLink = {
  id: string
  label: string
  href: string
}

export type WebsiteAnnouncementBar = {
  enabled: boolean
  message: string
  href?: string
}

export type WebsiteLayoutContent = {
  version: number
  updatedAt: string
  header: {
    /**
     * Optional custom stacked mark URL or data URL. When empty/undefined,
     * the public shell uses the bundled `AnvlLogoImage` (official mark).
     */
    logoStackedSrc?: string
    /** Reserved for a future media library — ignored until wired. */
    logoMediaAssetId?: string
    cartVisible: boolean
    announcement: WebsiteAnnouncementBar
    headerLinks: CmsLinkItem[]
    mobileExtraLinks: CmsLinkItem[]
  }
  footer: {
    logoStackedSrc?: string
    /** Reserved for a future media library — ignored until wired. */
    logoMediaAssetId?: string
    decorativeEmblemFallbackSrc?: string
    tagline: string
    microCaption: string
    linkGroups: WebsiteFooterLinkGroup[]
    newsletterTitle: string
    newsletterPlaceholder: string
    newsletterButtonText: string
    socialLinks: WebsiteSocialLink[]
    copyrightText?: string
  }
}
