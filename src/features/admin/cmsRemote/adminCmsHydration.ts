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
import { writeLegalContentToStorage } from '@/features/cms/legal/legalContent.settings'
import { parseLegalContent } from '@/features/cms/legal/legalContent.zod'
import { writeSupportContentToStorage } from '@/features/cms/support/supportContent.settings'
import { parseSupportContent } from '@/features/cms/support/supportContent.zod'
import { writePassportContentToStorage } from '@/features/cms/passportContent/passportContent.settings'
import { parsePassportContent } from '@/features/cms/passportContent/passportContent.zod'
import { writePdpContentToStorage } from '@/features/cms/pdpContent/pdpContent.settings'
import { parsePdpContent } from '@/features/cms/pdpContent/pdpContent.zod'
import { writeShopConfigToStorage } from '@/features/cms/shop/shopExperience.settings'
import { parseShopConfig } from '@/features/cms/shop/shopExperience.zod'
import {
  parseSiteSeoUnknown,
  writeSiteSeoContentToStorage,
} from '@/features/cms/siteSeo.local'
import { migrateOathTenetAssetsFromSlots } from '@/features/cms/landingContent/migrateOathTenetAssets'
import type { CmsSettingsFieldKey } from '@/features/admin/cmsRemote/adminCmsRemoteSync'
import {
  beginAdminCmsRemoteHydration,
  endAdminCmsRemoteHydration,
} from '@/features/admin/cmsRemote/adminCmsRemoteGate'

/**
 * Columns fetched together in the opening query. They predate the tolerant
 * per-column pattern below and share one round trip because the asset/landing
 * pair needs a cross-column migration step before either is written.
 */
const CORE_HYDRATED_COLUMNS = [
  'active_landing_page_key',
  'theme_config',
  'font_config',
  'asset_config',
  'landing_content',
] as const satisfies readonly CmsSettingsFieldKey[]

/**
 * Columns pulled ONE AT A TIME, each tolerant of its own failure: an
 * environment whose migration for that column has not run must not fail the
 * hydration of every other column (the editor then starts from local/defaults
 * for that one).
 *
 * Registering a column here is not optional bookkeeping — it is what the
 * compile-time coverage check at the bottom of this file measures. Three of
 * these (`pdp_content`, `shop_config`, `passport_content`) are WHOLE-MAP blobs:
 * every save republishes the entire map, so a browser that reaches an editor
 * without having pulled one first will publish a map containing only what that
 * session touched and destroy the rest — in `cms_settings` and in the
 * anon-readable `storefront_publication` mirror at the same time.
 */
const TOLERANT_COLUMN_PULLS = [
  { column: 'coming_soon', write: (v: unknown) => writeComingSoonConfigToStorage(parseComingSoonConfig(v)) },
  { column: 'banner_config', write: (v: unknown) => writeBannerConfigToStorage(parseBannerConfig(v)) },
  { column: 'passport_content', write: (v: unknown) => writePassportContentToStorage(parsePassportContent(v)) },
  { column: 'pdp_content', write: (v: unknown) => writePdpContentToStorage(parsePdpContent(v)) },
  { column: 'shop_config', write: (v: unknown) => writeShopConfigToStorage(parseShopConfig(v)) },
  { column: 'legal_content', write: (v: unknown) => writeLegalContentToStorage(parseLegalContent(v)) },
  { column: 'support_content', write: (v: unknown) => writeSupportContentToStorage(parseSupportContent(v)) },
  { column: 'site_seo', write: (v: unknown) => writeSiteSeoContentToStorage(parseSiteSeoUnknown(v)) },
] as const satisfies readonly {
  column: CmsSettingsFieldKey
  write: (value: unknown) => void
}[]

type HydratedCmsSettingsColumn =
  | (typeof CORE_HYDRATED_COLUMNS)[number]
  | (typeof TOLERANT_COLUMN_PULLS)[number]['column']

/** Runtime view of the same set, for the coverage test. */
export const HYDRATED_CMS_SETTINGS_COLUMNS: readonly CmsSettingsFieldKey[] = [
  ...CORE_HYDRATED_COLUMNS,
  ...TOLERANT_COLUMN_PULLS.map((pull) => pull.column),
]

/**
 * Compile-time coverage: every column the admin can WRITE
 * (`CMS_SETTINGS_FIELD_KEYS`) must also be a column hydration PULLS. The
 * `Exclude` is `never` when the two sets match; the moment a write-through
 * column ships without a pull, the leftover key stops satisfying the
 * `extends never` constraint and `pnpm typecheck` fails on this line.
 *
 * WHY this exists: `pdp_content` and `shop_config` sat in the write set with
 * no pull, so a fresh admin browser published an empty map over authored
 * content on its first save. Nothing structural connected the two lists, so
 * nothing caught it. Now something does.
 */
type AssertNoUnhydratedColumn<T extends never> = T
export type CmsHydrationCoverage = AssertNoUnhydratedColumn<
  Exclude<CmsSettingsFieldKey, HydratedCmsSettingsColumn>
>

/**
 * supabase-js types a returned row from the LITERAL column string passed to
 * `.select()`. These selects are built from the registries above, so the type
 * parser gives up and yields `GenericStringError`. Every value read out of the
 * row is handed straight to a Zod parser, so one narrowing helper here is
 * cheaper than duplicating the column lists as string literals purely to keep
 * an inference that buys nothing.
 */
function asRow(data: unknown): Record<string, unknown> | null {
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null
}

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
      .select(CORE_HYDRATED_COLUMNS.join(', '))
      .eq('id', 1)
      .maybeSingle()

    if (settingsRes.error) {
      throw new Error(settingsRes.error.message)
    }

    const settings = asRow(settingsRes.data)
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

    // The tolerant pulls are INDEPENDENT: each reads one column and writes one
    // localStorage key, so none depends on another's result or on ordering.
    // Run serially they cost 8 sequential Supabase round trips on every hard
    // admin load — the whole shell sits behind "Loading CMS…" for all of them
    // (F-15). Fired together they cost one.
    //
    // They stay EIGHT single-column requests rather than one combined `select`
    // on purpose: that is what makes them TOLERANT. A column missing from the
    // database (a pre-migration deployment) fails only its own request, while a
    // combined select would fail for ALL of them and silently reset every blob
    // to code defaults. `adminCmsHydration.test.ts` pins this by failing a
    // specific column, so collapsing them into one select turns that test red.
    //
    // Fetch is parallel; the WRITES stay sequential and in declaration order so
    // a parser that throws still aborts the rest exactly as before.
    const tolerantResults = await Promise.all(
      TOLERANT_COLUMN_PULLS.map(async ({ column, write }) => {
        const res = await client
          .from('cms_settings')
          .select(column)
          .eq('id', 1)
          .maybeSingle()
        return { column, write, row: res.error ? null : asRow(res.data) }
      }),
    )

    for (const { column, write, row } of tolerantResults) {
      if (row) write(row[column])
    }
  } finally {
    endAdminCmsRemoteHydration()
  }
}
