import type { SupabaseClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { canWriteCmsDraftsToSupabase } from '@/features/cms/api/cmsPersistenceMode'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import {
  fetchCmsProfileRole,
  type CmsProfileRole,
} from '@/features/admin/auth/adminCmsProfileRole'
import { readActiveLandingPageFromStorage } from '@/features/cms/landingPageActiveKey.settings'
import { readLandingContentFromStorage } from '@/features/cms/landingContent/landingContent.settings'
import {
  hasStoredShopConfig,
  readShopConfigFromStorage,
} from '@/features/cms/shop/shopExperience.settings'
import {
  hasStoredPdpContent,
  readPdpContentFromStorage,
} from '@/features/cms/pdpContent/pdpContent.settings'
import { readPassportContentFromStorage } from '@/features/cms/passportContent/passportContent.settings'
import { readComingSoonConfigFromStorage } from '@/features/cms/comingSoon/comingSoon.settings'
import { readBannerConfigFromStorage } from '@/features/cms/banner/bannerConfig.settings'
import { readLegalContentFromStorage } from '@/features/cms/legal/legalContent.settings'
import { readSupportContentFromStorage } from '@/features/cms/support/supportContent.settings'
import { getSiteSeoContent } from '@/features/cms/siteSeo.local'
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
 *
 * Declared as a runtime array rather than a bare union so the set is
 * ENUMERABLE: `adminCmsHydration.ts` subtracts the columns it pulls from this
 * list and fails `pnpm typecheck` if anything is left over. That is the
 * structural link that stops the next write-through column from shipping
 * without a matching hydration pull (the pdp_content/shop_config data-loss
 * bug was exactly that gap).
 */
export const CMS_SETTINGS_FIELD_KEYS = [
  'active_landing_page_key',
  'theme_config',
  'font_config',
  'asset_config',
  'landing_content',
  'shop_config',
  'pdp_content',
  'passport_content',
  'coming_soon',
  'banner_config',
  'legal_content',
  'support_content',
  'site_seo',
] as const

export type CmsSettingsFieldKey = (typeof CMS_SETTINGS_FIELD_KEYS)[number]

/**
 * Discriminated flush outcome. The old `{ ok: true }` shape hid SEVEN early
 * exits behind fake success — including "no Supabase session" and "role can't
 * write" — so editors toasted "Saved" while Supabase received nothing, and the
 * next admin load hydrated FROM Supabase and reverted the local edit (the
 * theme-revert / GLB-loss / marquee "not saving" family of bugs).
 *
 * - `skipped` — benign, expected no-op environments (tests, SSR, no Supabase
 *   configured, hydration pull in progress). Treated as success by callers.
 * - `error` — the save was expected to reach Supabase and did NOT. Every
 *   `save*Async` throws on this, so `useSingletonCmsEditor` (and the setup
 *   wizards) surface a real failure toast instead of a lying "Saved."
 */
export type AdminCmsFlushResult =
  | { status: 'ok'; rows: number }
  | { status: 'skipped'; reason: 'test' | 'ssr' | 'no-env' | 'hydration-lock' }
  | {
      status: 'error'
      reason: 'no-session' | 'role' | 'write-failed' | 'not-hydrated'
      message: string
    }

/**
 * Columns whose stored value is the WHOLE authored map / config, not a field
 * the editor patches in place. Publishing one replaces everything in it, in
 * `cms_settings` AND in the anon-readable `storefront_publication` mirror, in
 * a single UPDATE — so a local snapshot that was never hydrated (fresh
 * machine, incognito, cleared site data, `/admin/settings` local reset, or a
 * hydration pull that failed on that column) publishes a map containing only
 * what this session happened to touch and destroys the rest.
 *
 * Hydration (`adminCmsHydration.ts`) is the primary fix; this is the defence
 * that survives a hydration FAILURE, which is why it lives here — in the one
 * function every publish goes through — rather than in any single editor. A
 * guard only the newest caller checks would leave `/admin/products`,
 * `/admin/shop`, the techpack auto-import and the debounced auto-sync each
 * free to clobber independently.
 *
 * WHY the scoped path hard-fails instead of hydrating first and proceeding:
 * `save*Async` writes localStorage BEFORE flushing, so a mid-save pull would
 * overwrite the operator's just-made edit with the remote copy — trading a
 * silent clobber of every other product for a silent clobber of this one.
 * Merging is worse still: nothing at this layer can tell a deliberate
 * deletion from a key that was never loaded. Refusing is the only outcome
 * that loses no data, and the remedy (reload /admin) is one action, which the
 * message says. A silent skip is not an option — it would report success
 * while dropping the operator's edit.
 *
 * The UNSCOPED path (the debounced auto-sync) is different and is handled
 * differently below: the operator's edit there is in some *other* column, so
 * an unhydrated whole-map column is simply omitted from the patch and the
 * partial UPDATE leaves the remote value alone — the same "omit, never wipe"
 * rule already applied to `media_index`.
 */
interface WholeMapColumn {
  readonly column: CmsSettingsFieldKey
  readonly label: string
  /** What a publish from an empty local snapshot would destroy. */
  readonly risk: string
  /** True when this browser holds a local snapshot of the column at all. */
  readonly hasLocalSnapshot: () => boolean
}

const WHOLE_MAP_COLUMNS: readonly WholeMapColumn[] = [
  {
    column: 'pdp_content',
    label: 'Product (PDP) content',
    risk: "every other product's authored PDP content would be erased",
    hasLocalSnapshot: hasStoredPdpContent,
  },
  {
    column: 'shop_config',
    label: 'Shop experience settings',
    risk: 'the published shop configuration would be reset to code defaults',
    hasLocalSnapshot: hasStoredShopConfig,
  },
]

function findUnhydratedWholeMapColumns(): WholeMapColumn[] {
  return WHOLE_MAP_COLUMNS.filter((entry) => !entry.hasLocalSnapshot())
}

/** Test/diagnostic view of the guard: the column keys with no local snapshot. */
export function listUnhydratedWholeMapColumns(): CmsSettingsFieldKey[] {
  return findUnhydratedWholeMapColumns().map((entry) => entry.column)
}

function wholeMapClobberMessage(entries: readonly WholeMapColumn[]): string {
  const detail = entries
    .map((entry) => `${entry.label} (publishing now, ${entry.risk})`)
    .join('; ')
  return (
    `${detail}. This browser has not loaded that data from Supabase yet, so the ` +
    'change was saved in this browser only and NOT published. Reload /admin — ' +
    'it re-pulls the CMS — then save again.'
  )
}

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
    // The debounced path has no awaiting caller to throw at — surface real
    // failures directly (never silently drop a publish).
    void flushAdminCmsRemoteSync().then((result) => {
      if (result.status === 'error') toast.error(result.message)
    })
  }, 850)
}

/**
 * cms_profiles roles are effectively immutable within an admin session, so a
 * network round trip per save is waste — cache per userId. Cleared on logout
 * (see `AdminAuthProvider`). Only resolved roles are cached; a failed/empty
 * lookup retries on the next save.
 */
const cmsRoleCacheByUserId = new Map<string, CmsProfileRole>()

export function clearCmsProfileRoleCache(): void {
  cmsRoleCacheByUserId.clear()
}

/** Test seams for `runAdminCmsRemoteFlush` — defaults are the real implementations. */
export interface AdminCmsFlushOverrides {
  /** Replaces the `getAdminSessionServerFn`-based session recovery. */
  recoverSession?: (client: SupabaseClient) => Promise<boolean>
  /** Replaces the localStorage snapshot readers. */
  readAllValues?: () => Record<CmsSettingsFieldKey, unknown>
  /** Replaces the media-library read. `null` = unavailable (index omitted). */
  loadMediaIndex?: (client: SupabaseClient) => Promise<unknown[] | null>
}

function readAllCmsSettingsValues(): Record<CmsSettingsFieldKey, unknown> {
  return {
    active_landing_page_key: readActiveLandingPageFromStorage().key,
    theme_config: readThemeLibraryFromStorage(),
    font_config: readFontLibraryFromStorage(),
    asset_config: readAssetConfigFromStorage(),
    landing_content: readLandingContentFromStorage(),
    shop_config: readShopConfigFromStorage(),
    pdp_content: readPdpContentFromStorage(),
    passport_content: readPassportContentFromStorage(),
    coming_soon: readComingSoonConfigFromStorage(),
    banner_config: readBannerConfigFromStorage(),
    legal_content: readLegalContentFromStorage(),
    support_content: readSupportContentFromStorage(),
    site_seo: getSiteSeoContent(),
  }
}

/**
 * The browser Supabase client runs with `autoRefreshToken: false` (the sealed
 * server cookie is the sole refresh-token rotator — SEC-11), and the auth
 * heartbeat is 10 min against a ~1 h access-token life. A long-idle tab can
 * therefore hold no usable GoTrue session at save time. Recovery: ask the
 * server (which holds the HttpOnly cookie) for a freshly-rotated session and
 * hand its tokens to the browser client — exactly what `AdminAuthProvider`
 * does on mount/heartbeat, invoked here on demand.
 */
async function recoverAdminSessionFromServer(
  client: SupabaseClient,
): Promise<boolean> {
  try {
    // Dynamic import keeps the server-fn wiring out of this module's static
    // graph (it is only needed on this rare recovery path).
    const { getAdminSessionServerFn } = await import(
      '@/features/admin/auth/adminAuth'
    )
    // Deliberately bypasses `getCachedAdminSession` (adminAuthCache.ts): this
    // call exists to hand the browser client a FRESH accessToken/refreshToken
    // pair, and a cached result may already have been rotated away server-side
    // by the time we read it, defeating the whole point of a recovery call.
    const result = await getAdminSessionServerFn()
    if (!result.authenticated) return false
    const { error } = await client.auth.setSession({
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    })
    return !error
  } catch {
    return false
  }
}

async function defaultLoadMediaIndex(
  client: SupabaseClient,
): Promise<unknown[] | null> {
  const mediaList = await listMediaAssets(client)
  // On failure, omit the index (partial UPDATE keeps the previous one) instead
  // of the old behavior of publishing an empty [] and wiping it.
  return mediaList.ok ? buildMediaIndex(mediaList.assets) : null
}

function describeCmsWriteFailure(
  table: string,
  res: {
    error: { message: string } | null
    data: unknown[] | null
  },
): string | null {
  if (res.error) return `Publishing to ${table} failed: ${res.error.message}`
  if (!res.data || res.data.length === 0) {
    // `.update().eq('id', 1)` without `.select()` cannot tell "updated 1 row"
    // from "RLS filtered the row away" — the returned-rows check can.
    return (
      `Publishing to ${table} updated 0 rows — the singleton row (id = 1) is missing, ` +
      'or Row Level Security blocked the write for this account.'
    )
  }
  return null
}

/**
 * The environment-independent core of the flush, exported so tests can drive
 * it with a fake client (the public `flushAdminCmsRemoteSync` intentionally
 * short-circuits under Vitest so tests can never hit real Supabase).
 */
export async function runAdminCmsRemoteFlush(
  client: SupabaseClient,
  fields?: CmsSettingsFieldKey[],
  overrides?: AdminCmsFlushOverrides,
): Promise<AdminCmsFlushResult> {
  // --- Whole-map clobber guard (see WholeMapColumn above) -------------------
  // Checked before the session round trip: it is a local read, and there is no
  // point spending network on a publish that must not happen.
  const unhydrated = findUnhydratedWholeMapColumns()
  const namedUnhydrated = fields
    ? unhydrated.filter((entry) => fields.includes(entry.column))
    : []
  if (namedUnhydrated.length > 0) {
    return {
      status: 'error',
      reason: 'not-hydrated',
      message: wholeMapClobberMessage(namedUnhydrated),
    }
  }

  // --- Session (with ONE server-cookie recovery attempt) --------------------
  let session = (await client.auth.getSession()).data.session
  if (!session) {
    const recover = overrides?.recoverSession ?? recoverAdminSessionFromServer
    if (await recover(client)) {
      session = (await client.auth.getSession()).data.session
    }
  }
  if (!session) {
    return {
      status: 'error',
      reason: 'no-session',
      message:
        'Not signed in to Supabase — the change was saved in this browser only and NOT published. Reload /admin and sign in again.',
    }
  }

  // --- Role (cached per user for the session) -------------------------------
  const userId = session.user.id
  let role: CmsProfileRole | null = cmsRoleCacheByUserId.get(userId) ?? null
  if (!role) {
    const fetched = await fetchCmsProfileRole(client, userId)
    role = fetched.role
    if (role) cmsRoleCacheByUserId.set(userId, role)
  }
  if (!canWriteCmsDraftsToSupabase(role)) {
    return {
      status: 'error',
      reason: 'role',
      message: `This account's CMS role (${role ?? 'none'}) cannot publish — the change was saved in this browser only and NOT published.`,
    }
  }

  // --- Payload --------------------------------------------------------------
  const readAll = overrides?.readAllValues ?? readAllCmsSettingsValues
  // No `fields` given (the debounced auto-sync paths) keeps the previous
  // "sync everything from the local snapshot" behavior; an explicit list
  // (every editor's own "Save" action) scopes the UPDATE to just those
  // columns, so a concurrent save of a *different* section in another tab
  // can't be clobbered by this tab's possibly-stale view of it.
  const scopedValues = pickCmsSettingsFields(readAll(), fields)

  // Unscoped sync only (a scoped one naming an unhydrated column already
  // returned above, and one that doesn't name it never had it in the patch):
  // drop whole-map columns this browser never hydrated so the partial UPDATE
  // leaves the remote value alone instead of overwriting it with an empty map.
  for (const entry of unhydrated) delete scopedValues[entry.column]

  // `media_index` derives from `asset_config` alone — rebuilding it (a full
  // media-library round trip) on every theme/copy save was pure waste. Scoped
  // saves that don't touch assets omit it; the partial UPDATE keeps the old one.
  const includesAssetConfig = !fields || fields.includes('asset_config')
  let mediaIndex: unknown[] | null = null
  if (includesAssetConfig) {
    const load = overrides?.loadMediaIndex ?? defaultLoadMediaIndex
    mediaIndex = await load(client)
  }

  const now = new Date().toISOString()
  const settingsPatch = { ...scopedValues, updated_at: now }
  const pubPatch: Record<string, unknown> = {
    ...scopedValues,
    published_at: now,
    revision: Date.now(),
  }
  if (mediaIndex != null) pubPatch.media_index = mediaIndex

  // --- Writes (parallel; `.select('id')` proves a row was actually hit) -----
  const [settingsRes, pubRes] = await Promise.all([
    client.from('cms_settings').update(settingsPatch).eq('id', 1).select('id'),
    client
      .from('storefront_publication')
      .update(pubPatch)
      .eq('id', 1)
      .select('id'),
  ])

  const failure =
    describeCmsWriteFailure('cms_settings', settingsRes) ??
    describeCmsWriteFailure('storefront_publication', pubRes)
  if (failure) return { status: 'error', reason: 'write-failed', message: failure }

  return {
    status: 'ok',
    rows: (settingsRes.data?.length ?? 0) + (pubRes.data?.length ?? 0),
  }
}

export async function flushAdminCmsRemoteSync(
  fields?: CmsSettingsFieldKey[],
): Promise<AdminCmsFlushResult> {
  if (isTestRunner) return { status: 'skipped', reason: 'test' }
  if (typeof window === 'undefined') return { status: 'skipped', reason: 'ssr' }
  if (!getSupabasePublicEnv()) return { status: 'skipped', reason: 'no-env' }
  if (isAdminCmsRemoteHydrationLocked()) {
    return { status: 'skipped', reason: 'hydration-lock' }
  }

  const client = getAdminSupabaseBrowserClient()
  // Only reachable when window/env vanished between the guards above — benign.
  if (!client) return { status: 'skipped', reason: 'no-env' }

  return runAdminCmsRemoteFlush(client, fields)
}
