import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  HYDRATED_CMS_SETTINGS_COLUMNS,
  hydrateAdminCmsFromSupabase,
} from '../adminCmsHydration'
import {
  CMS_SETTINGS_FIELD_KEYS,
  clearCmsProfileRoleCache,
  listUnhydratedWholeMapColumns,
  runAdminCmsRemoteFlush,
  type CmsSettingsFieldKey,
} from '../adminCmsRemoteSync'
import {
  hasStoredPdpContent,
  readPdpContentFromStorage,
  savePdpContentAsync,
} from '@/features/cms/pdpContent/pdpContent.settings'
import { DEFAULT_PDP_PRODUCT_CONTENT } from '@/features/cms/pdpContent/pdpContent.zod'
import {
  hasStoredShopConfig,
  readShopConfigFromStorage,
  saveShopConfigAsync,
} from '@/features/cms/shop/shopExperience.settings'

// The whole-map guards are inert when Supabase is not the authority (nothing
// remote to clobber), so the suite has to look like a Supabase-backed admin.
vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => ({
    url: 'https://test.supabase.co',
    anonKey: 'sb_publishable_test_key_0123456789',
  }),
  isSupabaseAuthTarget: () => true,
  isUsableSupabasePublicKey: () => true,
  getSupabaseEnvIssue: () => null,
}))

// `save*Async` reaches Supabase through this module. Routing it at the real
// `runAdminCmsRemoteFlush` (rather than the env-gated `flushAdminCmsRemoteSync`,
// which deliberately short-circuits under Vitest) is what makes the tests below
// a real end-to-end: local write -> publish -> remote row.
const hoisted = vi.hoisted(() => ({
  publish: null as
    | null
    | ((
        fields?: readonly string[],
      ) => Promise<{ ok: true } | { ok: false; error: string }>),
}))

vi.mock('@/features/admin/cmsRemote/cmsWriteThrough', () => ({
  afterLocalCmsMutation: async (fields?: readonly string[]) =>
    hoisted.publish ? hoisted.publish(fields) : { ok: true as const },
}))

interface Row {
  [column: string]: unknown
}

/**
 * Fake Supabase modelling the two behaviors that matter here: a SELECT returns
 * exactly the requested columns (and can fail per column, like a DB whose
 * migration has not run), and an UPDATE is PARTIAL — it touches only the
 * columns present in the patch, which is precisely why publishing a whole-map
 * column from an empty local snapshot is destructive and omitting it is safe.
 */
function createFakeSupabase(
  settings: Row,
  publication: Row,
  opts?: { failColumns?: readonly string[]; rpcError?: string },
) {
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'admin-1' } } } }),
      setSession: async () => ({ data: {}, error: null }),
    },
    from(table: string) {
      if (table === 'cms_profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { role: 'admin' }, error: null }),
            }),
          }),
        }
      }
      const row = table === 'cms_settings' ? settings : publication
      return {
        select: (columns: string) => ({
          eq: () => ({
            maybeSingle: async () => {
              const keys = columns.split(',').map((c) => c.trim())
              const failed = keys.find((k) => opts?.failColumns?.includes(k))
              if (failed) {
                return {
                  data: null,
                  error: { message: `column cms_settings.${failed} does not exist` },
                }
              }
              const data: Row = {}
              for (const key of keys) data[key] = row[key] ?? null
              return { data, error: null }
            },
          }),
        }),
      }
    },
    // Publishing goes through the transactional RPC (F-19), so the fake models
    // the transaction: the patch lands on the settings row or nothing does.
    // `p_media_index` is publication-only and this fake tracks a single row, so
    // it is accepted and ignored rather than merged into the settings shape.
    async rpc(_fn: string, args: { p_patch: Row; p_media_index: unknown }) {
      // Models the transaction: BOTH rows move, or neither does.
      if (opts?.rpcError) return { data: null, error: { message: opts.rpcError } }
      Object.assign(settings, args.p_patch)
      Object.assign(publication, args.p_patch)
      if (args.p_media_index != null) publication.media_index = args.p_media_index
      return { data: { settings_rows: 1, publication_rows: 1 }, error: null }
    },
  }
  // Minimal structural fake — only the surface these paths touch exists, so a
  // documented cast is the pragmatic bridge to the (huge) SupabaseClient type.
  return client as unknown as SupabaseClient
}

/** The local snapshot the flush publishes from — real for the guarded blobs. */
function readLocalValues(): Record<CmsSettingsFieldKey, unknown> {
  return {
    active_landing_page_key: 'the-oath',
    theme_config: {},
    font_config: {},
    asset_config: {},
    landing_content: {},
    shop_config: readShopConfigFromStorage(),
    pdp_content: readPdpContentFromStorage(),
    passport_content: {},
    coming_soon: {},
    banner_config: {},
    legal_content: {},
    support_content: {},
    site_seo: {},
  }
}

function usePublisher(client: SupabaseClient): void {
  hoisted.publish = async (fields) => {
    const result = await runAdminCmsRemoteFlush(
      client,
      fields as CmsSettingsFieldKey[] | undefined,
      { readAllValues: readLocalValues, loadMediaIndex: async () => null },
    )
    return result.status === 'error'
      ? { ok: false, error: result.message }
      : { ok: true }
  }
}

/** Two products authored by other people, on other machines, long before now. */
function remoteSettings(): Row {
  return {
    active_landing_page_key: 'the-oath',
    pdp_content: {
      tee: { storyHeading: 'Tee story' },
      hoodie: { storyHeading: 'Hoodie story' },
    },
    shop_config: { heading: 'Remote Armory' },
  }
}

beforeEach(() => {
  hoisted.publish = null
  clearCmsProfileRoleCache()
})

describe('hydrateAdminCmsFromSupabase', () => {
  it('pulls pdp_content and shop_config into a fresh browser', async () => {
    expect(hasStoredPdpContent()).toBe(false)
    expect(hasStoredShopConfig()).toBe(false)

    await hydrateAdminCmsFromSupabase(createFakeSupabase(remoteSettings(), {}))

    expect(hasStoredPdpContent()).toBe(true)
    expect(hasStoredShopConfig()).toBe(true)
    expect(Object.keys(readPdpContentFromStorage()).sort()).toEqual(['hoodie', 'tee'])
    expect(readPdpContentFromStorage().hoodie?.storyHeading).toBe('Hoodie story')
    expect(readShopConfigFromStorage().heading).toBe('Remote Armory')
  })

  it('tolerates a column the environment does not have yet', async () => {
    const client = createFakeSupabase(remoteSettings(), {}, {
      failColumns: ['pdp_content'],
    })

    await expect(hydrateAdminCmsFromSupabase(client)).resolves.toBeUndefined()

    // The missing column starts from local/defaults; every other column still
    // hydrated, which is the whole point of the per-column tolerance.
    expect(hasStoredPdpContent()).toBe(false)
    expect(readShopConfigFromStorage().heading).toBe('Remote Armory')
  })
})

describe('hydration coverage', () => {
  it('hydrates every column the admin can write (no write-through column left behind)', () => {
    const missing = CMS_SETTINGS_FIELD_KEYS.filter(
      (key) => !HYDRATED_CMS_SETTINGS_COLUMNS.includes(key),
    )
    expect(missing).toEqual([])
  })
})

describe('whole-map clobber regression', () => {
  it('refuses a pdp_content save from a browser that never hydrated it', async () => {
    const settings = remoteSettings()
    const publication = remoteSettings()
    usePublisher(createFakeSupabase(settings, publication))

    // The editor's exact merge: local is empty, so this is a ONE-product map.
    expect(listUnhydratedWholeMapColumns()).toContain('pdp_content')
    const merged = {
      ...readPdpContentFromStorage(),
      tee: { ...DEFAULT_PDP_PRODUCT_CONTENT, storyHeading: 'Edited' },
    }
    expect(Object.keys(merged)).toEqual(['tee'])

    await expect(savePdpContentAsync(merged)).rejects.toThrow(/not loaded from Supabase/i)

    // Nothing was published: the other product is still there, in the editor
    // source of truth AND in the anon-readable mirror.
    expect(Object.keys(settings.pdp_content as Row).sort()).toEqual(['hoodie', 'tee'])
    expect(Object.keys(publication.pdp_content as Row).sort()).toEqual([
      'hoodie',
      'tee',
    ])
  })

  it('refuses a shop_config save from a browser that never hydrated it', async () => {
    const settings = remoteSettings()
    const publication = remoteSettings()
    usePublisher(createFakeSupabase(settings, publication))

    await expect(
      saveShopConfigAsync({ ...readShopConfigFromStorage(), heading: 'Oops' }),
    ).rejects.toThrow(/not loaded from Supabase/i)

    expect((settings.shop_config as Row).heading).toBe('Remote Armory')
    expect((publication.shop_config as Row).heading).toBe('Remote Armory')
  })

  it('publishes the full map once hydrated — the other products survive the save', async () => {
    const settings = remoteSettings()
    const publication = remoteSettings()
    const client = createFakeSupabase(settings, publication)
    usePublisher(client)

    await hydrateAdminCmsFromSupabase(client)
    const stored = readPdpContentFromStorage()
    const merged = {
      ...stored,
      tee: { ...DEFAULT_PDP_PRODUCT_CONTENT, ...stored.tee, storyHeading: 'Edited tee' },
    }
    await savePdpContentAsync(merged)

    const published = publication.pdp_content as Record<string, { storyHeading: string }>
    expect(Object.keys(published).sort()).toEqual(['hoodie', 'tee'])
    expect(published.tee?.storyHeading).toBe('Edited tee')
    expect(published.hoodie?.storyHeading).toBe('Hoodie story')
  })

  it('omits (never wipes) unhydrated whole-map columns on the unscoped auto-sync', async () => {
    const settings = remoteSettings()
    const publication = remoteSettings()
    const client = createFakeSupabase(settings, publication)

    // The debounced auto-sync publishes every tracked column from the local
    // snapshot. Its edit is in some OTHER column, so unhydrated whole-map
    // columns are dropped from the patch rather than failing the sync.
    const result = await runAdminCmsRemoteFlush(client, undefined, {
      readAllValues: readLocalValues,
      loadMediaIndex: async () => null,
    })

    expect(result.status).toBe('ok')
    expect(Object.keys(settings.pdp_content as Row).sort()).toEqual(['hoodie', 'tee'])
    expect((publication.shop_config as Row).heading).toBe('Remote Armory')
    expect(publication.active_landing_page_key).toBe('the-oath')
  })
})

describe('atomic publish (F-19)', () => {
  it('leaves BOTH tables untouched when the publish fails', async () => {
    // Before the transactional RPC, the two UPDATEs were independent and
    // postgrest-js never rejects on a transport failure — so a one-of-two
    // failure ran to completion as a HALF-WRITE, permanently diverging the CMS
    // draft from what SSR renders, with no signal the operator could find.
    const settings = remoteSettings()
    const publication = remoteSettings()
    const before = JSON.stringify([settings, publication])

    const client = createFakeSupabase(settings, publication, { rpcError: 'boom' })
    const result = await runAdminCmsRemoteFlush(client, ['theme_config'], {
      readAllValues: readLocalValues,
      loadMediaIndex: async () => null,
    })

    expect(result.status).toBe('error')
    expect(JSON.stringify([settings, publication])).toBe(before)
  })

  it('moves both tables together on success — they cannot diverge', async () => {
    const settings = remoteSettings()
    const publication = remoteSettings()
    const client = createFakeSupabase(settings, publication)

    // `theme_config`, not a whole-map column: this test is about atomicity, and
    // a whole-map column would be refused by the clobber guard first (this
    // suite's localStorage is deliberately un-hydrated).
    const result = await runAdminCmsRemoteFlush(client, ['theme_config'], {
      readAllValues: readLocalValues,
      loadMediaIndex: async () => null,
    })

    expect(result.status).toBe('ok')
    // The same invariant the production regression check asserts: the shared
    // columns are identical in both tables after a publish.
    expect(settings.theme_config).toEqual(publication.theme_config)
    expect(settings.active_landing_page_key).toEqual(publication.active_landing_page_key)
  })
})
