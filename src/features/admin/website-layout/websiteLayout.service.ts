import {
  WEBSITE_LAYOUT_VERSION,
  createDefaultWebsiteLayout,
} from './websiteLayout.defaults'
import {
  readWebsiteLayoutRaw,
  writeWebsiteLayoutRaw,
} from './websiteLayout.storage'
import type { WebsiteLayoutContent } from './websiteLayout.types'

function mergeWebsiteLayout(
  stored: Partial<WebsiteLayoutContent> | null,
): WebsiteLayoutContent {
  const defaults = createDefaultWebsiteLayout()
  if (!stored || typeof stored !== 'object') return defaults

  return {
    ...defaults,
    ...stored,
    version: WEBSITE_LAYOUT_VERSION,
    updatedAt:
      typeof stored.updatedAt === 'string' ? stored.updatedAt : defaults.updatedAt,
    header: {
      ...defaults.header,
      ...(stored.header ?? {}),
      announcement: {
        ...defaults.header.announcement,
        ...(stored.header?.announcement ?? {}),
      },
      headerLinks:
        Array.isArray(stored.header?.headerLinks) &&
        stored.header!.headerLinks.length > 0
          ? stored.header!.headerLinks
          : defaults.header.headerLinks,
      mobileExtraLinks: Array.isArray(stored.header?.mobileExtraLinks)
        ? stored.header!.mobileExtraLinks
        : defaults.header.mobileExtraLinks,
    },
    footer: {
      ...defaults.footer,
      ...(stored.footer ?? {}),
      linkGroups:
        Array.isArray(stored.footer?.linkGroups) &&
        stored.footer!.linkGroups.length > 0
          ? stored.footer!.linkGroups
          : defaults.footer.linkGroups,
      socialLinks: Array.isArray(stored.footer?.socialLinks)
        ? stored.footer!.socialLinks
        : defaults.footer.socialLinks,
    },
  }
}

export function getWebsiteLayoutContent(): WebsiteLayoutContent {
  const raw = readWebsiteLayoutRaw()
  if (!raw) return createDefaultWebsiteLayout()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return createDefaultWebsiteLayout()
    return mergeWebsiteLayout(parsed as Partial<WebsiteLayoutContent>)
  } catch {
    return createDefaultWebsiteLayout()
  }
}

export function saveWebsiteLayoutContent(
  content: WebsiteLayoutContent,
): WebsiteLayoutContent {
  const stamped: WebsiteLayoutContent = {
    ...content,
    version: WEBSITE_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
  }
  writeWebsiteLayoutRaw(JSON.stringify(stamped))
  return stamped
}
