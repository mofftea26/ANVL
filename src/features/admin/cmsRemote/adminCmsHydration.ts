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
import { writeComingSoonConfigToStorage } from '@/features/cms/comingSoon/comingSoon.settings'
import { parseComingSoonConfig } from '@/features/cms/comingSoon/comingSoon.zod'
import { writeBannerConfigToStorage } from '@/features/cms/banner/bannerConfig.settings'
import { parseBannerConfig } from '@/features/cms/banner/bannerConfig.zod'
import { writePassportContentToStorage } from '@/features/cms/passportContent/passportContent.settings'
import { parsePassportContent } from '@/features/cms/passportContent/passportContent.zod'
import { migrateOathTenetAssetsFromSlots } from '@/features/cms/landingContent/migrateOathTenetAssets'
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

    const assetConfig = parseAssetConfig(settings.asset_config)
    const landingContent = parseLandingContentConfig(settings.landing_content)
    const migrated = migrateOathTenetAssetsFromSlots(landingContent, assetConfig)
    writeAssetConfigToStorage(migrated.assetConfig)
    writeLandingContentToStorage(migrated.landingContent)

    // Separate tolerant query: a DB without the `coming_soon` migration must
    // not fail the main hydration above, so this column is fetched on its own
    // and any error is ignored (the editor then starts from local/defaults).
    const comingSoonRes = await client
      .from('cms_settings')
      .select('coming_soon')
      .eq('id', 1)
      .maybeSingle()
    if (!comingSoonRes.error && comingSoonRes.data) {
      writeComingSoonConfigToStorage(
        parseComingSoonConfig(comingSoonRes.data.coming_soon),
      )
    }

    // Same tolerant treatment for `banner_config` — pre-migration DBs must
    // not fail hydration; the editor then starts from local/defaults.
    const bannerRes = await client
      .from('cms_settings')
      .select('banner_config')
      .eq('id', 1)
      .maybeSingle()
    if (!bannerRes.error && bannerRes.data) {
      writeBannerConfigToStorage(parseBannerConfig(bannerRes.data.banner_config))
    }

    // Same tolerant treatment for `passport_content` — a fresh browser must
    // hydrate the authored passports before the editor's first save, or it
    // would clobber them with an empty local snapshot.
    const passportRes = await client
      .from('cms_settings')
      .select('passport_content')
      .eq('id', 1)
      .maybeSingle()
    if (!passportRes.error && passportRes.data) {
      writePassportContentToStorage(
        parsePassportContent(passportRes.data.passport_content),
      )
    }
  } finally {
    endAdminCmsRemoteHydration()
  }
}
