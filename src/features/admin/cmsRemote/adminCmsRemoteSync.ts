import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { canWriteCmsDraftsToSupabase } from '@/features/cms/api/cmsPersistenceMode'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { fetchCmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { readActiveLandingPageFromStorage } from '@/features/cms/landingPageActiveKey.settings'
import {
  readAssetConfigFromStorage,
  readFontConfigFromStorage,
  readThemeConfigFromStorage,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { isAdminCmsRemoteHydrationLocked } from '@/features/admin/cmsRemote/adminCmsRemoteGate'
import {
  buildMediaIndex,
  listMediaAssets,
} from '@/features/admin/media/mediaAssets.service'

const isTestRunner = import.meta.env.MODE === 'test'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

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

export async function flushAdminCmsRemoteSync(): Promise<
  { ok: true } | { ok: false; error: string }
> {
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

  const activeLandingPageKey = readActiveLandingPageFromStorage().key
  const themeConfig = readThemeConfigFromStorage()
  const fontConfig = readFontConfigFromStorage()
  const assetConfig = readAssetConfigFromStorage()

  const mediaList = await listMediaAssets(client)
  const mediaIndex = mediaList.ok ? buildMediaIndex(mediaList.assets) : []

  const settingsPatch = {
    active_landing_page_key: activeLandingPageKey,
    theme_config: themeConfig,
    font_config: fontConfig,
    asset_config: assetConfig,
    updated_at: new Date().toISOString(),
  }

  const { error: settingsErr } = await client
    .from('cms_settings')
    .update(settingsPatch)
    .eq('id', 1)

  if (settingsErr) return { ok: false, error: settingsErr.message }

  const pubPatch = {
    active_landing_page_key: activeLandingPageKey,
    theme_config: themeConfig,
    font_config: fontConfig,
    asset_config: assetConfig,
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
