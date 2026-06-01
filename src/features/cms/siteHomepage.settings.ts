import { z } from 'zod'

export const SITE_HOMEPAGE_STORAGE_KEY = 'anvl.siteHomepage.v1'
export const SITE_HOMEPAGE_CHANGE_EVENT = 'anvl:siteHomepage:change'

export type HomepageMode = 'default' | 'custom'

export type SiteHomepageSettings = {
  mode: HomepageMode
  updatedAt: string
}

const schema = z.object({
  mode: z.enum(['default', 'custom']),
  updatedAt: z.string(),
})

export const DEFAULT_SITE_HOMEPAGE: SiteHomepageSettings = {
  mode: 'custom',
  updatedAt: new Date().toISOString(),
}

export function parseSiteHomepageSettings(raw: unknown): SiteHomepageSettings {
  const r = schema.safeParse(raw)
  return r.success ? r.data : DEFAULT_SITE_HOMEPAGE
}

export function parseSiteHomepageUnknown(raw: unknown): SiteHomepageSettings {
  if (raw == null) return DEFAULT_SITE_HOMEPAGE
  return parseSiteHomepageSettings(raw)
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readSiteHomepageFromStorage(): SiteHomepageSettings {
  if (!isBrowser()) return DEFAULT_SITE_HOMEPAGE
  try {
    const raw = window.localStorage.getItem(SITE_HOMEPAGE_STORAGE_KEY)
    if (!raw) return DEFAULT_SITE_HOMEPAGE
    return parseSiteHomepageSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SITE_HOMEPAGE
  }
}

export function writeSiteHomepageToStorage(next: SiteHomepageSettings): void {
  if (!isBrowser()) return
  window.localStorage.setItem(SITE_HOMEPAGE_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(SITE_HOMEPAGE_CHANGE_EVENT, { detail: next }))
}

export function setHomepageMode(mode: HomepageMode): SiteHomepageSettings {
  const next: SiteHomepageSettings = {
    mode,
    updatedAt: new Date().toISOString(),
  }
  writeSiteHomepageToStorage(next)
  if (import.meta.env.MODE !== 'test') {
    void import('@/features/admin/cmsRemote/adminCmsRemoteSync').then((m) =>
      m.scheduleAdminCmsRemoteSync(),
    )
  }
  return next
}

/** Persist homepage mode locally, then flush to `storefront_publication` when configured. */
export async function saveSiteHomepageModeAsync(
  mode: HomepageMode,
): Promise<SiteHomepageSettings> {
  const next: SiteHomepageSettings = {
    mode,
    updatedAt: new Date().toISOString(),
  }
  writeSiteHomepageToStorage(next)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation()
  if (!sync.ok) {
    throw new Error(sync.error)
  }
  return next
}
