import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  clearCmsProfileRoleCache,
  listUnhydratedWholeMapColumns,
  pickCmsSettingsFields,
  runAdminCmsRemoteFlush,
  type CmsSettingsFieldKey,
} from '../adminCmsRemoteSync'
import {
  readPdpContentFromStorage,
  writePdpContentToStorage,
} from '@/features/cms/pdpContent/pdpContent.settings'
import {
  readShopConfigFromStorage,
  writeShopConfigToStorage,
} from '@/features/cms/shop/shopExperience.settings'

/**
 * Every test below models an admin whose hydration already ran, so the
 * whole-map clobber guard is satisfied. Without this, jsdom's freshly-cleared
 * localStorage looks exactly like the never-hydrated browser the guard exists
 * to stop — see the dedicated guard suite at the bottom of this file.
 */
function seedHydratedWholeMapSnapshots(): void {
  writePdpContentToStorage(readPdpContentFromStorage())
  writeShopConfigToStorage(readShopConfigFromStorage())
}

// saveThemeConfigAsync dynamically imports this module — mocking it lets the
// "save*Async throws on error result" contract be tested without Supabase.
vi.mock('@/features/admin/cmsRemote/cmsWriteThrough', () => ({
  afterLocalCmsMutation: vi.fn(async () => ({
    ok: false,
    error: 'Publishing to cms_settings failed: boom',
  })),
}))

const allValues: Record<CmsSettingsFieldKey, unknown> = {
  active_landing_page_key: 'the-oath',
  theme_config: { name: 'theme' },
  font_config: { name: 'font' },
  asset_config: { name: 'asset' },
  landing_content: { name: 'landing' },
  shop_config: { name: 'shop' },
  pdp_content: { name: 'pdp' },
  passport_content: { name: 'passport' },
  coming_soon: { name: 'coming_soon' },
  banner_config: { name: 'banner_config' },
  legal_content: { name: 'legal_content' },
  support_content: { name: 'support_content' },
  site_seo: { name: 'site_seo' },
}

describe('pickCmsSettingsFields', () => {
  it('returns every field when no scope is given (debounced auto-sync paths)', () => {
    expect(pickCmsSettingsFields(allValues)).toEqual(allValues)
  })

  it('scopes to a single field — the fix for the last-write-wins race', () => {
    // This is the exact scenario the fix addresses: tab A saves shop_config
    // while tab B's local snapshot still holds a stale theme_config. Scoping
    // the patch to only the field tab A actually changed means tab B's
    // still-in-flight theme_config never gets touched by tab A's write.
    expect(pickCmsSettingsFields(allValues, ['shop_config'])).toEqual({
      shop_config: { name: 'shop' },
    })
  })

  it('scopes to multiple fields when an editor saves more than one section at once', () => {
    expect(
      pickCmsSettingsFields(allValues, ['landing_content', 'asset_config']),
    ).toEqual({
      landing_content: { name: 'landing' },
      asset_config: { name: 'asset' },
    })
  })

  it('never includes a field outside the requested scope', () => {
    const result = pickCmsSettingsFields(allValues, ['theme_config'])
    expect(Object.keys(result)).toEqual(['theme_config'])
    expect(result).not.toHaveProperty('shop_config')
    expect(result).not.toHaveProperty('pdp_content')
  })

  it('includes banner_config and scopes the banner save to it alone', () => {
    expect(pickCmsSettingsFields(allValues)).toHaveProperty('banner_config')
    expect(pickCmsSettingsFields(allValues, ['banner_config'])).toEqual({
      banner_config: { name: 'banner_config' },
    })
  })

  it('includes legal_content and support_content and scopes each save to it alone', () => {
    const all = pickCmsSettingsFields(allValues)
    expect(all).toHaveProperty('legal_content')
    expect(all).toHaveProperty('support_content')
    expect(pickCmsSettingsFields(allValues, ['legal_content'])).toEqual({
      legal_content: { name: 'legal_content' },
    })
    expect(pickCmsSettingsFields(allValues, ['support_content'])).toEqual({
      support_content: { name: 'support_content' },
    })
  })

  it('returns an empty object for an empty field list', () => {
    expect(pickCmsSettingsFields(allValues, [])).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// runAdminCmsRemoteFlush — the environment-independent flush core, driven by a
// fake Supabase client so no test can ever touch a real project.
// ---------------------------------------------------------------------------

interface FakeClientOptions {
  session?: { user: { id: string } } | null
  role?: string | null
  roleError?: string
  settingsRows?: { id: number }[]
  pubRows?: { id: number }[]
  settingsError?: string
  pubError?: string
}

interface FakeClientCalls {
  getSession: number
  profileSelects: number
  settingsPatches: Record<string, unknown>[]
  pubPatches: Record<string, unknown>[]
}

function createFakeClient(opts: FakeClientOptions) {
  const calls: FakeClientCalls = {
    getSession: 0,
    profileSelects: 0,
    settingsPatches: [],
    pubPatches: [],
  }
  const fake = {
    auth: {
      getSession: async () => {
        calls.getSession += 1
        return { data: { session: opts.session ?? null } }
      },
      setSession: async () => ({ data: {}, error: null }),
    },
    from(table: string) {
      if (table === 'cms_profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                calls.profileSelects += 1
                if (opts.roleError) {
                  return { data: null, error: { message: opts.roleError } }
                }
                return {
                  data: opts.role ? { role: opts.role } : null,
                  error: null,
                }
              },
            }),
          }),
        }
      }
      return {
        update: (patch: Record<string, unknown>) => ({
          eq: () => ({
            select: async () => {
              if (table === 'cms_settings') {
                calls.settingsPatches.push(patch)
                if (opts.settingsError) {
                  return { data: null, error: { message: opts.settingsError } }
                }
                return { data: opts.settingsRows ?? [{ id: 1 }], error: null }
              }
              calls.pubPatches.push(patch)
              if (opts.pubError) {
                return { data: null, error: { message: opts.pubError } }
              }
              return { data: opts.pubRows ?? [{ id: 1 }], error: null }
            },
          }),
        }),
      }
    },
  }
  // Minimal structural fake — only the surface the flush touches exists, so a
  // documented cast is the pragmatic bridge to the (huge) SupabaseClient type.
  return { client: fake as unknown as SupabaseClient, calls }
}

const SESSION = { user: { id: 'user-1' } }

function overridesWithValues(extra?: {
  loadMediaIndex?: () => Promise<unknown[] | null>
}) {
  return {
    readAllValues: () => allValues,
    loadMediaIndex: extra?.loadMediaIndex ?? (async () => [{ id: 'm1' }]),
  }
}

describe('runAdminCmsRemoteFlush', () => {
  beforeEach(() => {
    clearCmsProfileRoleCache()
    seedHydratedWholeMapSnapshots()
  })

  it('returns a no-session error (after one failed recovery) instead of fake success', async () => {
    const { client } = createFakeClient({ session: null })
    const recoverSession = vi.fn(async () => false)
    const result = await runAdminCmsRemoteFlush(client, ['theme_config'], {
      ...overridesWithValues(),
      recoverSession,
    })
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('no-session')
      expect(result.message).toMatch(/NOT published/i)
    }
    expect(recoverSession).toHaveBeenCalledTimes(1)
  })

  it('recovers the session from the server cookie once and completes the flush', async () => {
    // First getSession: null; after recovery the fake starts returning a session.
    const opts: FakeClientOptions = { session: null, role: 'admin' }
    const { client, calls } = createFakeClient(opts)
    const recoverSession = vi.fn(async () => {
      opts.session = SESSION
      return true
    })
    const result = await runAdminCmsRemoteFlush(client, ['theme_config'], {
      ...overridesWithValues(),
      recoverSession,
    })
    expect(recoverSession).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ status: 'ok', rows: 2 })
    expect(calls.settingsPatches).toHaveLength(1)
    expect(calls.pubPatches).toHaveLength(1)
  })

  it('returns a role error for viewers instead of fake success', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'viewer' })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') expect(result.reason).toBe('role')
    expect(calls.settingsPatches).toHaveLength(0)
    expect(calls.pubPatches).toHaveLength(0)
  })

  it('caches the cms-profile role per user — one lookup across many saves', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    await runAdminCmsRemoteFlush(client, ['theme_config'], overridesWithValues())
    await runAdminCmsRemoteFlush(client, ['shop_config'], overridesWithValues())
    await runAdminCmsRemoteFlush(client, ['font_config'], overridesWithValues())
    expect(calls.profileSelects).toBe(1)
  })

  it('does not cache a failed role lookup (retries on the next save)', async () => {
    const opts: FakeClientOptions = { session: SESSION, role: null }
    const { client, calls } = createFakeClient(opts)
    const first = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(first.status).toBe('error')
    opts.role = 'admin'
    const second = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(second.status).toBe('ok')
    expect(calls.profileSelects).toBe(2)
  })

  it('skips the media_index rebuild for saves that do not touch asset_config', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const loadMediaIndex = vi.fn(async () => [{ id: 'm1' }])
    const result = await runAdminCmsRemoteFlush(client, ['theme_config'], {
      readAllValues: () => allValues,
      loadMediaIndex,
    })
    expect(result.status).toBe('ok')
    expect(loadMediaIndex).not.toHaveBeenCalled()
    expect(calls.pubPatches[0]).not.toHaveProperty('media_index')
    // The scoped column + publication bookkeeping still go through.
    expect(calls.pubPatches[0]).toHaveProperty('theme_config')
    expect(calls.pubPatches[0]).toHaveProperty('published_at')
  })

  it('rebuilds media_index when the save includes asset_config (and on full syncs)', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const loadMediaIndex = vi.fn(async () => [{ id: 'm1' }])
    await runAdminCmsRemoteFlush(client, ['asset_config'], {
      readAllValues: () => allValues,
      loadMediaIndex,
    })
    await runAdminCmsRemoteFlush(client, undefined, {
      readAllValues: () => allValues,
      loadMediaIndex,
    })
    expect(loadMediaIndex).toHaveBeenCalledTimes(2)
    expect(calls.pubPatches[0]).toHaveProperty('media_index', [{ id: 'm1' }])
    expect(calls.pubPatches[1]).toHaveProperty('media_index', [{ id: 'm1' }])
  })

  it('omits media_index (never wipes it) when the media library read fails', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(client, ['asset_config'], {
      readAllValues: () => allValues,
      loadMediaIndex: async () => null,
    })
    expect(result.status).toBe('ok')
    expect(calls.pubPatches[0]).not.toHaveProperty('media_index')
  })

  it('reports a write-failed error mentioning RLS when an UPDATE hits 0 rows', async () => {
    const { client } = createFakeClient({
      session: SESSION,
      role: 'admin',
      settingsRows: [],
    })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('write-failed')
      expect(result.message).toMatch(/cms_settings/)
      expect(result.message).toMatch(/Row Level Security/i)
    }
  })

  it('reports a write-failed error when Supabase rejects the UPDATE', async () => {
    const { client } = createFakeClient({
      session: SESSION,
      role: 'admin',
      pubError: 'permission denied for table storefront_publication',
    })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('write-failed')
      expect(result.message).toMatch(/storefront_publication/)
      expect(result.message).toMatch(/permission denied/)
    }
  })

  it('returns ok with the touched row count on success', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result).toEqual({ status: 'ok', rows: 2 })
    expect(calls.settingsPatches[0]).toEqual({
      theme_config: { name: 'theme' },
      updated_at: expect.any(String),
    })
  })
})

describe('whole-map clobber guard', () => {
  beforeEach(() => {
    clearCmsProfileRoleCache()
    // Deliberately NOT seeded: this is the fresh/reset browser.
  })

  it('reports both whole-map columns as unhydrated on a fresh browser', () => {
    expect(listUnhydratedWholeMapColumns().sort()).toEqual([
      'pdp_content',
      'shop_config',
    ])
  })

  it('refuses a scoped publish of an unhydrated column before touching the network', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['pdp_content'],
      overridesWithValues(),
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('not-hydrated')
      expect(result.message).toMatch(/NOT published/i)
      expect(result.message).toMatch(/Reload \/admin/i)
    }
    expect(calls.getSession).toBe(0)
    expect(calls.settingsPatches).toHaveLength(0)
    expect(calls.pubPatches).toHaveLength(0)
  })

  it('leaves a scoped publish of an unrelated column alone', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result.status).toBe('ok')
    expect(calls.settingsPatches[0]).not.toHaveProperty('pdp_content')
  })

  it('drops unhydrated whole-map columns from an unscoped sync instead of failing it', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(
      client,
      undefined,
      overridesWithValues(),
    )
    expect(result.status).toBe('ok')
    // Omitted -> the partial UPDATE leaves the remote maps untouched.
    expect(calls.settingsPatches[0]).not.toHaveProperty('pdp_content')
    expect(calls.settingsPatches[0]).not.toHaveProperty('shop_config')
    expect(calls.pubPatches[0]).not.toHaveProperty('pdp_content')
    expect(calls.pubPatches[0]).not.toHaveProperty('shop_config')
    // Everything else still publishes.
    expect(calls.settingsPatches[0]).toHaveProperty('theme_config')
    expect(calls.settingsPatches[0]).toHaveProperty('legal_content')
  })
})

describe('save*Async error propagation', () => {
  it('saveThemeConfigAsync throws the flush error message (editors toast it)', async () => {
    const { saveThemeConfigAsync } = await import(
      '@/features/cms/config/cmsSiteConfig.settings'
    )
    const { DEFAULT_THEME_LIBRARY } = await import(
      '@/features/cms/config/themeLibrary'
    )
    await expect(saveThemeConfigAsync(DEFAULT_THEME_LIBRARY)).rejects.toThrow(
      'Publishing to cms_settings failed: boom',
    )
  })
})
