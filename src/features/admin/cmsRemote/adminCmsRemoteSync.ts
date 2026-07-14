import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { canWriteCmsDraftsToSupabase } from '@/features/cms/api/cmsPersistenceMode'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { readActiveLandingPageFromStorage } from '@/features/cms/landingPageActiveKey.settings'
import { readLandingContentFromStorage } from '@/features/cms/landingContent/landingContent.settings'
import { readShopConfigFromStorage } from '@/features/cms/shop/shopExperience.settings'
import { readPdpContentFromStorage } from '@/features/cms/pdpContent/pdpContent.settings'
import { readPassportContentFromStorage } from '@/features/cms/passportContent/passportContent.settings'
import { readComingSoonConfigFromStorage } from '@/features/cms/comingSoon/comingSoon.settings'
import {
  readAssetConfigFromStorage,
  readFontLibraryFromStorage,
  readThemeLibraryFromStorage,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { isAdminCmsRemoteHydrationLocked } from '@/features/admin/cmsRemote/adminCmsRemoteGate'
import {
  buildMediaIndex,
  listMediaAssets,
} from '@/features/admin/media/mediaAssets.service'

const isTestRunner = import.meta.env.MODE === 'test'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * The `cms_settings` / `storefront_publication` columns this sync module
 * knows how to scope a write to. Each singleton CMS editor's save function
 * passes its own single field here (see `cmsWriteThrough.ts`), so two admins
 * saving *different* sections concurrently each only ever `UPDATE` the one
 * column they actually changed — Postgres leaves every other column alone
 * regardless of what stale value this tab's local snapshot happened to hold
 * for it. Omitting `fields` (the debounced auto-sync paths — media index
 * changes, SEO edits) falls back to the previous "sync everything from the
 * local snapshot" behavior, which is fine for those lower-frequency paths.
 */
export type CmsSettingsFieldKey =
  | 'active_landing_page_key'
  | 'theme_config'
  | 'font_config'
  | 'asset_config'
  | 'landing_content'
  | 'shop_config'
  | 'pdp_content'
  | 'passport_content'
  | 'coming_soon'

/**
 * Pure helper, extracted so the field-scoping behavior is directly unit
 * testable without going through `flushAdminCmsRemoteSync` (which
 * short-circuits under Vitest via `isTestRunner`, by design, to guarantee
 * tests never hit real Supabase). Returns only the requested keys (or every
 * key, if `fields` is omitted) from `allValues`.
 */
export function pickCmsSettingsFields(
  allValues: Record<CmsSettingsFieldKey, unknown>,
  fields?: CmsSettingsFieldKey[],
): Partial<Record<CmsSettingsFieldKey, unknown>> {
  const keysToWrite = fields ?? (Object.keys(allValues) as CmsSettingsFieldKey[])
  return Object.fromEntries(keysToWrite.map((key) => [key, allValues[key]]))
}

export function scheduleAdminCmsRemoteSync(): void {
  if (isTestRunner) return
  if (typeof window === 'undefined') return
  if (!getSupabasePublicEnv()) return
  if (isAdminCmsRemoteHydrationLocked()) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void flushAdminCmsRemoteSync()
  }, 850)
}

export async function flushAdminCmsRemoteSync(
  fields?: CmsSettingsFieldKey[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isTestRunner) return { ok: true }
  if (typeof window === 'undefined') return { ok: true }
  if (!getSupabasePublicEnv()) return { ok: true }
  if (isAdminCmsRemoteHydrationLocked()) return { ok: true }

  const client = getAdminSupabaseBrowserClient()
  if (!client) return { ok: true }

  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) return { ok: true }

  const { role } = await fetchCmsProfileRole(client)
  if (!canWriteCmsDraftsToSupabase(role)) return { ok: true }

  const allValues: Record<CmsSettingsFieldKey, unknown> = {
    active_landing_page_key: readActiveLandingPageFromStorage().key,
    theme_config: readThemeLibraryFromStorage(),
    font_config: readFontLibraryFromStorage(),
    asset_config: readAssetConfigFromStorage(),
    landing_content: readLandingContentFromStorage(),
    shop_config: readShopConfigFromStorage(),
    pdp_content: readPdpContentFromStorage(),
    passport_content: readPassportContentFromStorage(),
    coming_soon: readComingSoonConfigFromStorage(),
  }
  // No `fields` given (the debounced auto-sync paths) keeps the previous
  // "sync everything from the local snapshot" behavior; an explicit list
  // (every editor's own "Save" action) scopes the UPDATE to just those
  // columns, so a concurrent save of a *different* section in another tab
  // can't be clobbered by this tab's possibly-stale view of it.
  const scopedValues = pickCmsSettingsFields(allValues, fields)

  const mediaList = await listMediaAssets(client)
  const mediaIndex = mediaList.ok ? buildMediaIndex(mediaList.assets) : []

  const settingsPatch = {
    ...scopedValues,
    updated_at: new Date().toISOString(),
  }

  const { error: settingsErr } = await client
    .from('cms_settings')
    .update(settingsPatch)
    .eq('id', 1)

  if (settingsErr) return { ok: false, error: settingsErr.message }

  const pubPatch = {
    ...scopedValues,
    media_index: mediaIndex,
    published_at: new Date().toISOString(),
    revision: Date.now(),
  }

  const { error: pubErr } = await client
    .from('storefront_publication')
    .update(pubPatch)
    .eq('id', 1)

  if (pubErr) return { ok: false, error: pubErr.message }

  return { ok: true }
}
