import type { SupabaseClient } from '@supabase/supabase-js'
import { writeActiveLandingPageToStorage } from '@/features/cms/landingPageActiveKey.settings'
import {
  writeAssetConfigToStorage,
  writeFontLibraryToStorage,
  writeThemeLibraryToStorage,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { parseAssetConfig } from '@/features/cms/config/cmsSiteConfig.zod'
import { parseFontLibrary } from '@/features/cms/config/fontLibrary'
import { parseThemeLibrary } from '@/features/cms/config/themeLibrary'
import { writeLandingContentToStorage } from '@/features/cms/landingContent/landingContent.settings'
import { parseLandingContentConfig } from '@/features/cms/landingContent/landingContent.zod'
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
      .select(
        'active_landing_page_key, theme_config, font_config, asset_config, landing_content',
      )
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

    writeThemeLibraryToStorage(parseThemeLibrary(settings.theme_config))
    writeFontLibraryToStorage(parseFontLibrary(settings.font_config))
    writeAssetConfigToStorage(parseAssetConfig(settings.asset_config))
    writeLandingContentToStorage(
      parseLandingContentConfig(settings.landing_content),
    )
  } finally {
    endAdminCmsRemoteHydration()
  }
}
