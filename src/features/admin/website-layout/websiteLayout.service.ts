import {
  WEBSITE_LAYOUT_VERSION,
  createDefaultWebsiteLayout,
} from './websiteLayout.defaults'
import { isActiveDropNavTemplateHref } from './websiteLayout.nav'
import {
  readWebsiteLayoutRaw,
  writeWebsiteLayoutRaw,
} from './websiteLayout.storage'
import type { WebsiteLayoutContent } from './websiteLayout.types'

function normalizeLogoSrc(src: string | undefined): string | undefined {
  const t = src?.trim()
  return t ? t : undefined
}

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
      logoStackedSrc: normalizeLogoSrc(stored.header?.logoStackedSrc),
      logoMediaAssetId:
        typeof stored.header?.logoMediaAssetId === 'string'
          ? stored.header.logoMediaAssetId.trim() || undefined
          : defaults.header.logoMediaAssetId,
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
      logoStackedSrc: normalizeLogoSrc(stored.footer?.logoStackedSrc),
      logoMediaAssetId:
        typeof stored.footer?.logoMediaAssetId === 'string'
          ? stored.footer.logoMediaAssetId.trim() || undefined
          : defaults.footer.logoMediaAssetId,
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

export function getWebsiteLayoutSaveError(
  content: WebsiteLayoutContent,
): string | null {
  const hasDropSlot = content.header.headerLinks.some((l) =>
    isActiveDropNavTemplateHref(l.href),
  )
  if (!hasDropSlot) {
    return 'Desktop navigation must include at least one link whose URL starts with /drop/ (the active campaign slot).'
  }
  return null
}

export function normalizeWebsiteLayoutForPersist(
  content: WebsiteLayoutContent,
): WebsiteLayoutContent {
  return {
    ...content,
    header: {
      ...content.header,
      logoStackedSrc: normalizeLogoSrc(content.header.logoStackedSrc),
      logoMediaAssetId: content.header.logoMediaAssetId?.trim() || undefined,
    },
    footer: {
      ...content.footer,
      logoStackedSrc: normalizeLogoSrc(content.footer.logoStackedSrc),
      logoMediaAssetId: content.footer.logoMediaAssetId?.trim() || undefined,
    },
  }
}

export function saveWebsiteLayoutContent(
  content: WebsiteLayoutContent,
): WebsiteLayoutContent {
  const err = getWebsiteLayoutSaveError(content)
  if (err) {
    throw new Error(err)
  }
  const stamped: WebsiteLayoutContent = {
    ...normalizeWebsiteLayoutForPersist(content),
    version: WEBSITE_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
  }
  writeWebsiteLayoutRaw(JSON.stringify(stamped))
  return stamped
}
