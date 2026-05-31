/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
  getSupabasePublicEnv: () => null,
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

describe('DropEditorRoute draft sync', () => {
  beforeEach(() => {
    mockDropsState.drops = [createDefaultTheOathDrop()]
  })

  it('keeps unsaved draft edits when saved drop changes from remote rehydrate', async () => {
    const user = userEvent.setup()
    const { rerender } = renderDropEditor()

    await waitFor(() => {
      expect(screen.getByLabelText(/drop name/i)).toBeTruthy()
    })

    const nameInput = screen.getByLabelText(/drop name/i) as HTMLInputElement
    await user.clear(nameInput)
    await user.type(nameInput, 'Unsaved edit')

    expect(nameInput.value).toBe('Unsaved edit')

    mockDropsState.drops = [
      {
        ...createDefaultTheOathDrop(),
        name: 'Remote stale title',
        title: 'Remote stale title',
      },
    ]

    rerender(
      <AdminPageActionsProvider>
        <DropEditorRoute dropId={DEFAULT_OATH_DROP_ID} />
      </AdminPageActionsProvider>,
    )

    await waitFor(() => {
      expect((screen.getByLabelText(/drop name/i) as HTMLInputElement).value).toBe(
        'Unsaved edit',
      )
    })
  })
})
