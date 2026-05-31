import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, beforeEach, expect, it, vi } from 'vitest'

import type { Drop } from '@/features/admin/drops/drops.types'
import { DropEditorRoute } from '@/features/admin/drops/DropEditorRoute'
import {
  DEFAULT_OATH_DROP_ID,
  createDefaultTheOathDrop,
} from '@/features/admin/drops/drops.defaults'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { AdminPageActionsProvider } from '@/features/admin/components/AdminPageActionsContext'

const mockDropsState = vi.hoisted(() => ({
  drops: [] as Drop[],
}))

const mockRehydrate = vi.hoisted(() => vi.fn())

vi.mock('@/features/admin/drops/useDrops', () => ({
  useDropsList: () => mockDropsState.drops,
}))

vi.mock('@/features/admin/drops/useDropLiveOnStorefront', () => ({
  useDropLiveOnStorefront: (
    _dropId: string | undefined,
    localIsActive: boolean,
  ) => localIsActive,
}))

vi.mock('@/features/admin/drops/useAdminDropsListQuery', () => ({
  useSetActiveAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateAdminDropMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/admin/products/useAdminProducts', () => ({
  useAdminProductsList: () => [],
}))

vi.mock('@/features/admin/website-layout/useWebsiteLayout', () => ({
  useWebsiteLayout: () => createDefaultWebsiteLayout(),
}))

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: vi.fn() }),
}))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => ({
    url: 'https://test.supabase.co',
    anonKey: 'test-key',
  }),
}))

vi.mock('@/features/admin/cmsRemote/rehydrateAdminCmsFromRemote', () => ({
  rehydrateAdminCmsFromRemote: () => mockRehydrate(),
}))

vi.mock('@/features/admin/components/AdminLayout', () => ({
  AdminLayout: ({
    children,
    title,
  }: {
    children?: ReactNode
    title?: string
  }) => (
    <div data-testid="admin-layout-stub">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children?: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

function renderDropEditor(dropId = DEFAULT_OATH_DROP_ID) {
  return render(
    <AdminPageActionsProvider>
      <DropEditorRoute dropId={dropId} />
    </AdminPageActionsProvider>,
  )
}

describe('DropEditorRoute remote resolve', () => {
  beforeEach(() => {
    mockDropsState.drops = []
    mockRehydrate.mockReset()
  })

  it('shows loading while rehydrating a missing drop from Supabase', async () => {
    let finishRehydrate: () => void = () => {}
    mockRehydrate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishRehydrate = resolve
        }),
    )

    renderDropEditor()

    expect(screen.getByText(/loading drop editor/i)).toBeTruthy()
    expect(mockRehydrate).toHaveBeenCalledTimes(1)

    finishRehydrate()
    await waitFor(() => {
      expect(screen.getByText(/could not resolve this drop id/i)).toBeTruthy()
    })
  })

  it('opens the editor after rehydration populates the drop locally', async () => {
    mockRehydrate.mockImplementation(async () => {
      mockDropsState.drops = [createDefaultTheOathDrop()]
    })

    const { rerender } = renderDropEditor()

    await waitFor(() => {
      expect(mockRehydrate).toHaveBeenCalled()
    })

    rerender(
      <AdminPageActionsProvider>
        <DropEditorRoute dropId={DEFAULT_OATH_DROP_ID} />
      </AdminPageActionsProvider>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/could not resolve this drop id/i)).toBeNull()
    })
    expect(screen.getByRole('tab', { name: /basics/i })).toBeTruthy()
  })
})
