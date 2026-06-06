import { cmsMockData } from '@/features/cms/data/cms.mock'
import type {
  StorefrontCampaign,
  StorefrontLookbookItem,
} from '@/features/cms/api/publicStorefrontPublication'
import { createCmsId } from '@/features/admin/lib/cmsId'
import {
  readSiteHomeExtrasRaw,
  writeSiteHomeExtrasRaw,
} from './siteHome.storage'
import {
  SITE_HOME_EXTRAS_VERSION,
  siteHomeExtrasSchema,
  type SiteHomeExtrasContent,
} from './siteHome.types'

function defaultSiteHomeExtras(): SiteHomeExtrasContent {
  return {
    campaigns: structuredClone(cmsMockData.campaigns),
    lookbook: structuredClone(cmsMockData.lookbook),
    updatedAt: new Date().toISOString(),
  }
}

function normalizeSiteHomeExtras(
  stored: Partial<SiteHomeExtrasContent> | null,
): SiteHomeExtrasContent {
  const defaults = defaultSiteHomeExtras()
  if (!stored || typeof stored !== 'object') return defaults
  return {
    campaigns: Array.isArray(stored.campaigns) ? stored.campaigns : defaults.campaigns,
    lookbook: Array.isArray(stored.lookbook) ? stored.lookbook : defaults.lookbook,
    updatedAt:
      typeof stored.updatedAt === 'string' ? stored.updatedAt : defaults.updatedAt,
  }
}

export function getSiteHomeExtrasContent(): SiteHomeExtrasContent {
  const raw = readSiteHomeExtrasRaw()
  if (!raw) return defaultSiteHomeExtras()
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = siteHomeExtrasSchema.safeParse(parsed)
    if (!result.success) return defaultSiteHomeExtras()
    return normalizeSiteHomeExtras(result.data)
  } catch {
    return defaultSiteHomeExtras()
  }
}

export function getSiteHomeCampaigns(): StorefrontCampaign[] {
  return getSiteHomeExtrasContent().campaigns
}

export function getSiteHomeLookbook(): StorefrontLookbookItem[] {
  return getSiteHomeExtrasContent().lookbook
}

export function emptyCampaign(): StorefrontCampaign {
  return {
    id: createCmsId('camp'),
    title: 'New campaign',
    description: '',
  }
}

export function emptyLookbookItem(): StorefrontLookbookItem {
  return {
    id: createCmsId('look'),
    alt: '',
    src: '',
  }
}

export function saveSiteHomeExtrasContent(
  content: SiteHomeExtrasContent,
): SiteHomeExtrasContent {
  const stamped: SiteHomeExtrasContent = {
    campaigns: content.campaigns.filter((c) => c.title.trim().length > 0),
    lookbook: content.lookbook.filter((l) => l.src.trim().length > 0),
    updatedAt: new Date().toISOString(),
  }
  writeSiteHomeExtrasRaw(
    JSON.stringify({ ...stamped, version: SITE_HOME_EXTRAS_VERSION }),
  )
  if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
    void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
      m.scheduleAdminCmsRemoteSync(),
    )
  }
  return stamped
}

export async function saveSiteHomeExtrasContentAsync(
  content: SiteHomeExtrasContent,
): Promise<SiteHomeExtrasContent> {
  const stamped = saveSiteHomeExtrasContent(content)
  const { getSupabasePublicEnv } = await import('@/features/cms/api/supabasePublicEnv')
  if (!getSupabasePublicEnv()) return stamped
  const { flushAdminCmsRemoteSync } = await import(
    '@/features/admin/cmsRemote/adminCmsRemoteSync'
  )
  const result = await flushAdminCmsRemoteSync()
  if (!result.ok) {
    throw new Error(result.error)
  }
  return stamped
}
