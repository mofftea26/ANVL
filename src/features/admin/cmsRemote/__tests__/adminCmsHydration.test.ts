/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hydrateAdminCmsFromSupabase, preferLocalDropWhenNewer } from '@/features/admin/cmsRemote/adminCmsHydration'
import { fetchAdminDropsListFromSupabase } from '@/features/admin/cmsRemote/adminCmsDropsList'
import {
  getDropById,
  persistDropsState,
  readDropsArray,
  resetAllLocalCmsKeys,
  resetDropSystemHydrationGate,
} from '@/features/admin/drops/drops.service'
import { createEmptyDrop } from '@/features/admin/drops/drops.defaults'
import { persistedDropSchema } from '@/features/admin/drops/drops.persistence.zod'

const mockFrom = vi.fn()

vi.mock('@/features/shopify/config/shopifyPublicEnv', () => ({
  getShopifyPublicEnv: vi.fn(() => null),
}))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: vi.fn(() => ({
    url: 'https://test.supabase.co',
    anonKey: 'test-key',
  })),
}))

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => ({
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: 'u1' } } },
      })),
    },
    from: mockFrom,
  }),
}))

function dropsChain(result: { data: unknown; error: null | { message: string } }) {
  return {
    select: vi.fn(function select() {
      return {
        order: vi.fn(async () => result),
      }
    }),
  }
}

function pubChain(result: { data: unknown; error: null | { message: string } }) {
  return {
    select: vi.fn(function select() {
      return {
        eq: vi.fn(function eq() {
          return {
            maybeSingle: vi.fn(async () => result),
          }
        }),
      }
    }),
  }
}

function productsChain(result: { data: unknown; error: null | { message: string } }) {
  return {
    select: vi.fn(function select() {
      return {
        order: vi.fn(async () => result),
      }
    }),
  }
}

const LEGACY_CLIENT_DROP_ID = 'drop_legacy-campaign'
const LEGACY_BODY = {
  id: LEGACY_CLIENT_DROP_ID,
  name: 'Legacy Campaign',
  title: 'Legacy Campaign',
  slug: 'legacy-campaign',
  dropNumber: '99',
  productIds: [],
}

describe('hydrateAdminCmsFromSupabase', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    resetAllLocalCmsKeys()
  })

  it('persists legacy remote drop bodies that fail strict schema parsing', async () => {
    expect(persistedDropSchema.safeParse(LEGACY_BODY).success).toBe(false)

    const dropsQuery = dropsChain({
      data: [
        {
          id: 'db-legacy',
          slug: 'legacy-campaign',
          status: 'inactive',
          client_drop_id: LEGACY_CLIENT_DROP_ID,
          body: LEGACY_BODY,
        },
      ],
      error: null,
    })
    const publicationQuery = pubChain({
      data: { active_drop_id: null, website_layout: null, site_seo: null, global_brand: null },
      error: null,
    })
    const productsQuery = productsChain({ data: [], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'anvl_drops') return dropsQuery
      if (table === 'storefront_publication') return publicationQuery
      if (table === 'cms_admin_products') return productsQuery
      throw new Error(`unexpected table ${table}`)
    })

    await hydrateAdminCmsFromSupabase({
      from: mockFrom,
    } as never)

    expect(getDropById(LEGACY_CLIENT_DROP_ID)?.slug).toBe('legacy-campaign')
    expect(readDropsArray().some((d) => d.id === LEGACY_CLIENT_DROP_ID)).toBe(true)
  })

  it('uses the same client drop id as the admin drops list for legacy bodies', async () => {
    const dropsQuery = dropsChain({
      data: [
        {
          id: 'db-legacy',
          slug: 'legacy-campaign',
          status: 'inactive',
          client_drop_id: LEGACY_CLIENT_DROP_ID,
          body: LEGACY_BODY,
        },
      ],
      error: null,
    })
    const publicationQuery = pubChain({
      data: {
        active_drop_id: null,
        website_layout: null,
        site_seo: null,
        global_brand: null,
      },
      error: null,
    })
    const productsQuery = productsChain({ data: [], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'anvl_drops') return dropsQuery
      if (table === 'storefront_publication') return publicationQuery
      if (table === 'cms_admin_products') return productsQuery
      throw new Error(`unexpected table ${table}`)
    })

    await hydrateAdminCmsFromSupabase({
      from: mockFrom,
    } as never)

    const list = await fetchAdminDropsListFromSupabase()
    expect(list.ok).toBe(true)
    if (!list.ok) return

    expect(list.items).toHaveLength(1)
    expect(list.items[0]?.id).toBe(LEGACY_CLIENT_DROP_ID)
    expect(getDropById(list.items[0]!.id)?.name).toBe('Legacy Campaign')
  })

  it('prefers newer local drop over stale remote during rehydrate', async () => {
    const clientDropId = 'drop_local-newer'
    const localUpdatedAt = '2026-05-28T12:00:00.000Z'
    const remoteUpdatedAt = '2026-05-27T12:00:00.000Z'

    const localDrop = {
      ...createEmptyDrop(),
      id: clientDropId,
      slug: 'local-newer',
      name: 'Local edited title',
      title: 'Local edited title',
      updatedAt: localUpdatedAt,
      createdAt: remoteUpdatedAt,
    }

    persistDropsState([localDrop], null)
    resetDropSystemHydrationGate()

    const dropsQuery = dropsChain({
      data: [
        {
          id: 'db-local',
          slug: 'local-newer',
          status: 'inactive',
          client_drop_id: clientDropId,
          body: {
            ...createEmptyDrop(),
            id: clientDropId,
            slug: 'local-newer',
            name: 'Remote stale title',
            title: 'Remote stale title',
            updatedAt: remoteUpdatedAt,
            createdAt: remoteUpdatedAt,
          },
        },
      ],
      error: null,
    })
    const publicationQuery = pubChain({
      data: { active_drop_id: null, website_layout: null, site_seo: null, global_brand: null },
      error: null,
    })
    const productsQuery = productsChain({ data: [], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'anvl_drops') return dropsQuery
      if (table === 'storefront_publication') return publicationQuery
      if (table === 'cms_admin_products') return productsQuery
      throw new Error(`unexpected table ${table}`)
    })

    await hydrateAdminCmsFromSupabase({
      from: mockFrom,
    } as never)

    expect(getDropById(clientDropId)?.name).toBe('Local edited title')
    expect(readDropsArray()[0]?.updatedAt).toBe(localUpdatedAt)
  })
})

describe('preferLocalDropWhenNewer', () => {
  it('returns local when updatedAt is newer', () => {
    const local = { id: 'd1', updatedAt: '2026-05-28T12:00:00.000Z' } as never
    const remote = { id: 'd1', updatedAt: '2026-05-27T12:00:00.000Z' } as never
    expect(preferLocalDropWhenNewer(local, remote)).toBe(local)
  })

  it('returns remote when updatedAt is newer', () => {
    const local = { id: 'd1', updatedAt: '2026-05-27T12:00:00.000Z' } as never
    const remote = { id: 'd1', updatedAt: '2026-05-28T12:00:00.000Z' } as never
    expect(preferLocalDropWhenNewer(local, remote)).toBe(remote)
  })
})
