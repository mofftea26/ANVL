import { createCmsId } from '@/features/admin/lib/cmsId'
import type { CmsLinkItem } from '@/features/cms/navigation/navigation.types'
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
