import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { CmsLinkItem } from '@/features/admin/landing-cms/landingCms.types'
import type {
  WebsiteFooterLinkGroup,
  WebsiteSocialLink,
} from '@/features/admin/website-layout/websiteLayout.types'

export function emptyLink(): CmsLinkItem {
  return {
    id: createCmsId('nav'),
    label: 'New link',
    href: '/',
    isVisible: true,
  }
}

export function emptySocial(): WebsiteSocialLink {
  return {
    id: createCmsId('soc'),
    label: 'Social',
    href: '#',
  }
}

export function emptyGroup(): WebsiteFooterLinkGroup {
  return {
    id: createCmsId('fg'),
    title: 'Group',
    links: [emptyLink()],
  }
}

export function emptyDropCampaignLink(): CmsLinkItem {
  return {
    id: createCmsId('nav'),
    label: 'Active campaign',
    href: '/drop/the-oath',
    isVisible: true,
  }
}
