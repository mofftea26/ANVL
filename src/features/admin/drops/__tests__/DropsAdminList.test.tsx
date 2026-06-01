import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'

import { DropsAdminList } from '@/features/admin/drops/DropsAdminList'
import { useDropsListUiStore } from '@/features/admin/drops/dropsListUi.store'

const MOCK_DROPS: AdminDropListItem[] = [
  {
    id: 'drop-alpha',
    slug: 'alpha-slug',
    title: 'Alpha campaign',
    name: 'Alpha internal',
    dropNumber: 'D01',
    status: 'inactive',
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
    status: 'inactive',
    isActive: false,
    productCount: 1,
    updatedAt: '2026-03-01T12:00:00.000Z',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
]

const activateMutation = vi.hoisted(() => ({
  isPending: false,
  mutate: vi.fn(),
}))

const refetchDropsList = vi.hoisted(() => vi.fn())

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
    refetch: refetchDropsList,
  }),
  useDuplicateAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useSetActiveAdminDropMutation: () => activateMutation,
  useScheduleAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
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

async function openActivateDialog(user: ReturnType<typeof userEvent.setup>) {
  const betaCard = screen.getByText('Beta internal').closest('section')!
  const trigger = within(betaCard).getByRole('button', { name: /actions for beta campaign/i })
  await user.click(trigger)
  await user.click(await screen.findByRole('menuitem', { name: /set active/i }))
}

describe('DropsAdminList', () => {
  beforeEach(() => {
    useDropsListUiStore.setState({ search: '', statusTab: 'all' })
    activateMutation.isPending = false
    activateMutation.mutate.mockReset()
    refetchDropsList.mockReset()
    refetchDropsList.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('exposes the square New drop control by accessible name', () => {
    renderList()

    const create = screen.getByRole('link', { name: /create new drop/i })
    expect(create.getAttribute('href')).toBe('/admin/drops/new')
  })

  it('renders drop cards in a responsive grid (no table)', () => {
    renderList()

    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('Alpha internal')).toBeTruthy()
    expect(screen.getByText('Beta internal')).toBeTruthy()
    expect(screen.getByText(/Drop D01/)).toBeTruthy()
    expect(screen.getByText(/Drop D02/)).toBeTruthy()
  })

  it('opens the row overflow menu from the card ⋯ trigger', async () => {
    const user = userEvent.setup()
    renderList()

    const betaCard = screen.getByText('Beta internal').closest('section')!
    const trigger = within(betaCard).getByRole('button', { name: /actions for beta campaign/i })
    await user.click(trigger)
    expect(await screen.findByRole('menu')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /^edit$/i })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /duplicate/i })).toBeTruthy()
  })

  it('sorts cards when changing the sort dropdown (newest first by default)', async () => {
    const user = userEvent.setup()
    renderList()

    const headings = () =>
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())
    expect(headings()[0]).toMatch(/Beta/)

    const sortTrigger = screen.getByRole('combobox', { name: /sort drops/i })
    await user.click(sortTrigger)
    await user.click(await screen.findByRole('option', { name: /campaign \(a–z\)/i }))

    expect(headings()[0]).toMatch(/Alpha/)
  })

  it('shows Activating… on the confirm button while activation is pending', async () => {
    const user = userEvent.setup()
    const { rerender } = renderList()
    await openActivateDialog(user)

    expect(screen.getByRole('button', { name: /^activate$/i })).toBeTruthy()

    activateMutation.isPending = true
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <DropsAdminList />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('button', { name: /activating/i })).toBeTruthy()
  })

  it('refetches the drops list after successful activation', async () => {
    const user = userEvent.setup()
    activateMutation.mutate.mockImplementation((_id, opts) => {
      void opts?.onSuccess?.()
    })

    renderList()
    await openActivateDialog(user)
    await user.click(screen.getByRole('button', { name: /^activate$/i }))

    expect(activateMutation.mutate).toHaveBeenCalledWith(
      'drop-beta',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    expect(refetchDropsList).toHaveBeenCalled()
  })
})
