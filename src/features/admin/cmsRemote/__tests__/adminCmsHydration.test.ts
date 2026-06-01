/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hydrateAdminCmsFromSupabase, preferLocalDropWhenNewer } from '@/features/admin/cmsRemote/adminCmsHydration'
import {
  getDropById,
  persistDropsState,
  readDropsArray,
  resetAllLocalCmsKeys,
  resetDropSystemHydrationGate,
} from '@/features/admin/drops/drops.service'
import { createEmptyDrop, DEFAULT_OATH_DROP_ID } from '@/features/admin/drops/drops.defaults'
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

  it('replaces legacy remote drops with the stock Oath drop', async () => {
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

    expect(getDropById(LEGACY_CLIENT_DROP_ID)).toBeUndefined()
    expect(readDropsArray()).toHaveLength(1)
    expect(readDropsArray()[0]?.id).toBe(DEFAULT_OATH_DROP_ID)
  })

  it('keeps only the Oath drop in local storage after hydration cleanup', async () => {
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

    expect(readDropsArray()).toHaveLength(1)
    expect(readDropsArray()[0]?.id).toBe(DEFAULT_OATH_DROP_ID)
    expect(getDropById(DEFAULT_OATH_DROP_ID)?.name).toBe('The Oath')
  })

  it('normalizes non-Oath hydration rows to the stock Oath drop', async () => {
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

    expect(getDropById(clientDropId)).toBeUndefined()
    expect(readDropsArray()).toHaveLength(1)
    expect(readDropsArray()[0]?.id).toBe(DEFAULT_OATH_DROP_ID)
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
