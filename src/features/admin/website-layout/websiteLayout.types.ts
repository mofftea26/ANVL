import type { CmsLinkItem } from '@/features/admin/landing-cms/landingCms.types'

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
    logoStackedSrc?: string
    cartVisible: boolean
    announcement: WebsiteAnnouncementBar
    headerLinks: CmsLinkItem[]
    mobileExtraLinks: CmsLinkItem[]
  }
  footer: {
    logoStackedSrc?: string
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
