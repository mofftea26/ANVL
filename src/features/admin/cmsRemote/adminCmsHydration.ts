import type { SupabaseClient } from '@supabase/supabase-js'
import { writeActiveLandingPageToStorage } from '@/features/cms/landingPageActiveKey.settings'
import {
  writeAssetConfigToStorage,
  writeFontConfigToStorage,
  writeThemeConfigToStorage,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  parseAssetConfig,
  parseFontConfig,
  parseThemeConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'
import {
  beginAdminCmsRemoteHydration,
  endAdminCmsRemoteHydration,
} from '@/features/admin/cmsRemote/adminCmsRemoteGate'

/**
 * Pull canonical CMS rows from Supabase into localStorage keys the admin editors use.
 */
export async function hydrateAdminCmsFromSupabase(
  client: SupabaseClient,
): Promise<void> {
  beginAdminCmsRemoteHydration()
  try {
    const settingsRes = await client
      .from('cms_settings')
      .select('active_landing_page_key, theme_config, font_config, asset_config')
      .eq('id', 1)
      .maybeSingle()

    if (settingsRes.error) {
      throw new Error(settingsRes.error.message)
    }

    const settings = settingsRes.data
    if (!settings) return

    const key = settings.active_landing_page_key
    if (typeof key === 'string' && key.length > 0) {
      writeActiveLandingPageToStorage({
        key,
        updatedAt: new Date().toISOString(),
      })
    }

    writeThemeConfigToStorage(parseThemeConfig(settings.theme_config))
    writeFontConfigToStorage(parseFontConfig(settings.font_config))
    writeAssetConfigToStorage(parseAssetConfig(settings.asset_config))
  } finally {
    endAdminCmsRemoteHydration()
  }
}
