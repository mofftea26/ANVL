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
  /** Publishing now goes through ONE transactional RPC, so there is a single
   *  failure mode rather than a per-table one (F-19). */
  rpcError?: string
  rpcRows?: { settings_rows: number; publication_rows: number }
}

interface FakeClientCalls {
  getSession: number
  profileSelects: number
  rpcCalls: { fn: string; p_patch: Record<string, unknown>; p_media_index: unknown }[]
  /** Any surviving direct table UPDATE. Must stay empty: a second, independent
   *  write is exactly what created the half-published state F-19 describes. */
  directUpdates: string[]
}

function createFakeClient(opts: FakeClientOptions) {
  const calls: FakeClientCalls = {
    getSession: 0,
    profileSelects: 0,
    rpcCalls: [],
    directUpdates: [],
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
        update: () => ({
          eq: () => ({
            select: async () => {
              // Recorded, not served: publishing must go through the RPC.
              calls.directUpdates.push(table)
              return { data: [{ id: 1 }], error: null }
            },
          }),
        }),
      }
    },
    async rpc(
      fn: string,
      args: { p_patch: Record<string, unknown>; p_media_index: unknown },
    ) {
      calls.rpcCalls.push({ fn, ...args })
      if (opts.rpcError) return { data: null, error: { message: opts.rpcError } }
      return {
        data: opts.rpcRows ?? { settings_rows: 1, publication_rows: 1 },
        error: null,
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
    expect(calls.rpcCalls).toHaveLength(1)
    expect(calls.directUpdates).toHaveLength(0)
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
    expect(calls.rpcCalls).toHaveLength(0)
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
    expect(calls.rpcCalls[0]!.p_media_index).toBeNull()
    // The scoped column + publication bookkeeping still go through.
    expect(calls.rpcCalls[0]!.p_patch).toHaveProperty('theme_config')
    expect(calls.rpcCalls[0]!.fn).toBe('publish_cms_settings')
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
    expect(calls.rpcCalls[0]!.p_media_index).toEqual([{ id: 'm1' }])
    expect(calls.rpcCalls[1]!.p_media_index).toEqual([{ id: 'm1' }])
  })

  it('omits media_index (never wipes it) when the media library read fails', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(client, ['asset_config'], {
      readAllValues: () => allValues,
      loadMediaIndex: async () => null,
    })
    expect(result.status).toBe('ok')
    expect(calls.rpcCalls[0]!.p_media_index).toBeNull()
  })

  it('reports a write-failed error, and says BOTH tables rolled back, when the publish fails', async () => {
    // The 0-rows case (missing singleton, or RLS filtering the row away) now
    // RAISES inside `publish_cms_settings`, which rolls both UPDATEs back
    // together — so it reaches the client as one ordinary RPC error rather than
    // a per-table result that has to be pieced together.
    const { client, calls } = createFakeClient({
      session: SESSION,
      role: 'admin',
      rpcError: 'publish matched no row (cms_settings=0, storefront_publication=0)',
    })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('write-failed')
      expect(result.message).toMatch(/rolled back/i)
      expect(result.message).toMatch(/still agree/i)
      expect(result.message).toMatch(/publish matched no row/)
    }
    // The reassurance in that message is only true if nothing else wrote.
    expect(calls.directUpdates).toHaveLength(0)
  })

  it('surfaces a permission failure from the RPC', async () => {
    const { client } = createFakeClient({
      session: SESSION,
      role: 'admin',
      rpcError: 'cms admin role required',
    })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('write-failed')
      expect(result.message).toMatch(/cms admin role required/)
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
    // No `updated_at`: the timestamps and `revision` moved server-side into the
    // RPC, so the patch now carries content columns ONLY.
    expect(calls.rpcCalls[0]!.p_patch).toEqual({ theme_config: { name: 'theme' } })
    expect(calls.rpcCalls[0]!.fn).toBe('publish_cms_settings')
  })

  it('publishes through ONE call — never a second, independent write', async () => {
    // The regression this pins: two independent UPDATEs could half-succeed and
    // permanently diverge the CMS draft from the live storefront (F-19).
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    await runAdminCmsRemoteFlush(client, undefined, overridesWithValues())
    expect(calls.rpcCalls).toHaveLength(1)
    expect(calls.directUpdates).toEqual([])
  })
})

describe('whole-map clobber guard', () => {
  beforeEach(() => {
    clearCmsProfileRoleCache()
    // Deliberately NOT seeded: this is the fresh/reset browser.
  })

  it('reports every whole-map column as unhydrated on a fresh browser', () => {
    // `passport_content` is a per-slug map exactly like `pdp_content`, so it
    // carries the same "publishing from an empty snapshot erases every other
    // product" risk and must be guarded alongside it.
    expect(listUnhydratedWholeMapColumns().sort()).toEqual([
      'passport_content',
      'pdp_content',
      'shop_config',
    ])
  })

  it('refuses a scoped publish of unhydrated passport_content', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['passport_content'],
      overridesWithValues(),
    )
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('not-hydrated')
      expect(result.message).toMatch(/NOT published/i)
    }
    // The whole point of the guard: it refuses BEFORE any network write.
    expect(calls.rpcCalls).toHaveLength(0)
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
    expect(calls.rpcCalls).toHaveLength(0)
  })

  it('leaves a scoped publish of an unrelated column alone', async () => {
    const { client, calls } = createFakeClient({ session: SESSION, role: 'admin' })
    const result = await runAdminCmsRemoteFlush(
      client,
      ['theme_config'],
      overridesWithValues(),
    )
    expect(result.status).toBe('ok')
    expect(calls.rpcCalls[0]!.p_patch).not.toHaveProperty('pdp_content')
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
    expect(calls.rpcCalls[0]!.p_patch).not.toHaveProperty('pdp_content')
    expect(calls.rpcCalls[0]!.p_patch).not.toHaveProperty('shop_config')
    // Everything else still publishes.
    expect(calls.rpcCalls[0]!.p_patch).toHaveProperty('theme_config')
    expect(calls.rpcCalls[0]!.p_patch).toHaveProperty('legal_content')
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
