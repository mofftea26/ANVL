import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'

import { DropsAdminList } from '@/features/admin/drops/DropsAdminList'
import { useDropsListUiStore } from '@/features/admin/drops/dropsListUi.store'

function mockMediumViewport() {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query.includes('768px'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

const MOCK_DROPS: AdminDropListItem[] = [
  {
    id: 'drop-alpha',
    slug: 'alpha-slug',
    title: 'Alpha campaign',
    name: 'Alpha internal',
    dropNumber: 'D01',
    status: 'draft',
    isActive: false,
    productCount: 2,
    updatedAt: '2026-01-01T12:00:00.000Z',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'drop-beta',
    slug: 'beta-slug',
    title: 'Beta campaign',
    name: 'Beta internal',
    dropNumber: 'D02',
    status: 'draft',
    isActive: false,
    productCount: 1,
    updatedAt: '2026-03-01T12:00:00.000Z',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
]

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to: string
    params?: { dropId?: string }
    children?: ReactNode
    className?: string
    [key: string]: unknown
  }) => {
    let href = to
    if (params?.dropId) href = `/admin/drops/${params.dropId}`
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
}))

vi.mock('@/features/admin/drops/useAdminDropsListQuery', () => ({
  ADMIN_DROPS_LIST_QUERY_KEY: ['admin', 'drops', 'list'],
  useAdminDropsListQuery: () => ({
    data: MOCK_DROPS,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useDuplicateAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useSetActiveAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useScheduleAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <DropsAdminList />
    </QueryClientProvider>,
  )
}

describe('DropsAdminList', () => {
  beforeEach(() => {
    useDropsListUiStore.setState({ search: '', statusTab: 'all' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exposes the square New drop control by accessible name', () => {
    mockMediumViewport()
    renderList()

    const create = screen.getByRole('link', { name: /create new drop/i })
    expect(create.getAttribute('href')).toBe('/admin/drops/new')
  })

  it('opens the row overflow menu from the ⋯ trigger', async () => {
    mockMediumViewport()
    const user = userEvent.setup()
    renderList()

    const table = screen.getByRole('table')
    const trigger = within(table).getByRole('button', { name: /actions for beta campaign/i })
    await user.click(trigger)
    expect(await screen.findByRole('menu')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /^edit$/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /duplicate/i })).toBeTruthy()
  })

  it('sorts rows when toggling the Campaign header (TanStack Table)', async () => {
    mockMediumViewport()
    const user = userEvent.setup()
    renderList()

    const table = screen.getByRole('table')
    const bodyRows = within(table).getAllByRole('row').slice(1)
    expect(bodyRows[0]?.textContent).toMatch(/Beta campaign/)

    await user.click(screen.getByRole('button', { name: /^campaign$/i }))

    const bodyRowsAsc = within(table).getAllByRole('row').slice(1)
    expect(bodyRowsAsc[0]?.textContent).toMatch(/Alpha campaign/)
  })

  it('renders the overflow column as the leftmost desktop column header', () => {
    mockMediumViewport()
    renderList()

    const table = screen.getByRole('table')
    const headerRow = within(table).getAllByRole('row')[0]!
    const columnHeaders = within(headerRow).getAllByRole('columnheader')
    expect(columnHeaders[0]?.textContent?.trim().toLowerCase()).toBe('actions')
  })

  it('keeps the wide drops table in an overflow-x-auto wrapper (no page-level spill)', () => {
    mockMediumViewport()
    renderList()

    const table = screen.getByRole('table')
    const scrollShell = table.parentElement
    expect(scrollShell).not.toBeNull()
    expect(scrollShell!.classList.contains('overflow-x-auto')).toBe(true)
    expect(scrollShell!.classList.contains('max-w-full')).toBe(true)
  })
})
