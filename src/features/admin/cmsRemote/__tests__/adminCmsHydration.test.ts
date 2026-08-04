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
  opts?: { failColumns?: readonly string[] },
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
        update: (patch: Row) => ({
          eq: () => ({
            select: async () => {
              Object.assign(row, patch)
              return { data: [{ id: 1 }], error: null }
            },
          }),
        }),
      }
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
