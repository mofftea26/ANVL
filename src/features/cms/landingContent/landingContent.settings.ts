import {
  DEFAULT_LANDING_CONTENT,
  parseLandingContentConfig,
  type LandingContentConfig,
} from '@/features/cms/landingContent/landingContent.zod'

/**
 * Local working copy of CMS landing content (per-landing-key copy blobs).
 *
 * Mirrors the `landingPageActiveKey.settings.ts` pattern: localStorage store
 * for instant admin preview + cross-tab sync, flushed to
 * `cms_settings.landing_content` and `storefront_publication.landing_content`
 * by the admin remote sync. Reads are storefront-safe; async writes
 * dynamically import the admin sync module (never in the storefront chunk).
 */

export const LANDING_CONTENT_STORAGE_KEY = 'anvl.landingContent.v1'
export const LANDING_CONTENT_CHANGE_EVENT = 'anvl:landingContent:change'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readLandingContentFromStorage(): LandingContentConfig {
  if (!isBrowser()) return DEFAULT_LANDING_CONTENT
  try {
    const raw = window.localStorage.getItem(LANDING_CONTENT_STORAGE_KEY)
    if (!raw) return DEFAULT_LANDING_CONTENT
    return parseLandingContentConfig(JSON.parse(raw))
  } catch {
    return DEFAULT_LANDING_CONTENT
  }
}

export function writeLandingContentToStorage(next: LandingContentConfig): void {
  if (!isBrowser()) return
  window.localStorage.setItem(
    LANDING_CONTENT_STORAGE_KEY,
    JSON.stringify(next),
  )
  window.dispatchEvent(
    new CustomEvent(LANDING_CONTENT_CHANGE_EVENT, { detail: next }),
  )
}

export function subscribeLandingContentChange(
  listener: () => void,
): () => void {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(LANDING_CONTENT_CHANGE_EVENT, handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === LANDING_CONTENT_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(LANDING_CONTENT_CHANGE_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}

/** Replace one landing page's content slice in the local working copy. */
export function setLandingContentSlice(
  pageKey: string,
  slice: Record<string, unknown>,
): LandingContentConfig {
  const next: LandingContentConfig = {
    ...readLandingContentFromStorage(),
    [pageKey]: slice,
  }
  writeLandingContentToStorage(next)
  return next
}

/** Persist locally, then flush to `storefront_publication` + `cms_settings`. */
export async function saveLandingContentSliceAsync(
  pageKey: string,
  slice: Record<string, unknown>,
): Promise<LandingContentConfig> {
  const next = setLandingContentSlice(pageKey, slice)
  const { afterLocalCmsMutation } = await import(
    '@/features/admin/cmsRemote/cmsWriteThrough'
  )
  const sync = await afterLocalCmsMutation(['landing_content'])
  if (!sync.ok) {
    throw new Error(sync.error)
  }
  return next
}
