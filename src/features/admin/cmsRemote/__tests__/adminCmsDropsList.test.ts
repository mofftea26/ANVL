import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fetchAdminDropsListFromSupabase } from '@/features/admin/cmsRemote/adminCmsDropsList'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'

const mockGetSession = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: vi.fn(() => ({
    url: 'https://test.supabase.co',
    anonKey: 'test-key',
  })),
}))

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  }),
}))

const oathDrop = createDefaultTheOathDrop()
const secondDrop = {
  ...createDefaultTheOathDrop(),
  id: 'client-two',
  slug: 'drop-two',
  title: 'Drop Two',
  name: 'Drop Two',
  isActive: false,
  status: 'inactive' as const,
}

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

describe('fetchAdminDropsListFromSupabase', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockFrom.mockReset()
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
    })
  })

  it('marks live drop from storefront_publication.active_drop_id', async () => {
    const dropsQuery = dropsChain({
      data: [
        {
          id: 'db-oath',
          slug: 'the-oath',
          status: 'inactive',
          client_drop_id: oathDrop.id,
          body: JSON.parse(JSON.stringify(oathDrop)),
        },
        {
          id: 'db-other',
          slug: 'drop-two',
          status: 'inactive',
          client_drop_id: secondDrop.id,
          body: JSON.parse(JSON.stringify(secondDrop)),
        },
      ],
      error: null,
    })

    const publicationQuery = pubChain({
      data: { active_drop_id: 'db-other' },
      error: null,
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'anvl_drops') return dropsQuery
      if (table === 'storefront_publication') return publicationQuery
      throw new Error(`unexpected table ${table}`)
    })

    const result = await fetchAdminDropsListFromSupabase()
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.items).toHaveLength(2)
    expect(result.items.find((d) => d.id === oathDrop.id)?.isActive).toBe(
      false,
    )
    expect(result.items.find((d) => d.id === secondDrop.id)?.isActive).toBe(true)
  })

  it('lists drops when body is missing newer required fields', async () => {
    const dropsQuery = dropsChain({
      data: [
        {
          id: 'db-legacy',
          slug: 'legacy-drop',
          status: 'active',
          client_drop_id: 'client-legacy',
          body: {
            id: 'client-legacy',
            slug: 'legacy-drop',
            title: 'Legacy Drop',
            name: 'Legacy Drop',
            dropNumber: '01',
            status: 'active',
            isActive: true,
            createdAt: oathDrop.createdAt,
            updatedAt: oathDrop.updatedAt,
            productIds: [],
          },
        },
      ],
      error: null,
    })

    const publicationQuery = pubChain({
      data: { active_drop_id: 'db-legacy' },
      error: null,
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'anvl_drops') return dropsQuery
      if (table === 'storefront_publication') return publicationQuery
      throw new Error(`unexpected table ${table}`)
    })

    const result = await fetchAdminDropsListFromSupabase()
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.id).toBe('client-legacy')
    expect(result.items[0]?.isActive).toBe(true)
    expect(result.items[0]?.title).toBe('Legacy Drop')
  })
})
