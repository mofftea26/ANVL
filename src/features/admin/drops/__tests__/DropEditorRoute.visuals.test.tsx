/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
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
import { DROP_EDITOR_SPLIT_LG_MIN_H_CLASS } from '@/features/admin/drops/dropEditorRoute.shared'

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
  useSetActiveAdminDropMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeactivateAdminDropMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
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

vi.mock('@/features/admin/components/AdminLayout', async () => {
  const { useAdminPageActionsSlot } = await import(
    '@/features/admin/components/AdminPageActionsContext'
  )
  function LayoutProbe({ title }: { title?: string }) {
    const actions = useAdminPageActionsSlot()
    return (
      <header data-testid="layout-header-probe">
        <h1>{title}</h1>
        <div data-testid="admin-page-actions">{actions}</div>
      </header>
    )
  }
  return {
    AdminLayout: ({
      children,
      title,
    }: {
      children?: ReactNode
      title?: string
    }) => (
      <div data-testid="admin-layout-stub">
        <LayoutProbe title={title} />
        {children}
      </div>
    ),
  }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children?: ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function renderDropEditor() {
  return render(
    <AdminPageActionsProvider>
      <DropEditorRoute dropId={DEFAULT_OATH_DROP_ID} />
    </AdminPageActionsProvider>,
  )
}

describe('DropEditorRoute Basics campaign assets', () => {
  beforeEach(() => {
    mockDropsState.drops = [createDefaultTheOathDrop()]
  })

  it('gives the live preview column a viewport-based minimum height on Theme tab', async () => {
    const user = userEvent.setup()
    renderDropEditor()
    await user.click(await screen.findByRole('tab', { name: /theme/i }))
    const pane = await screen.findByTestId('drop-editor-preview-column')
    expect(pane.className).toContain('lg:h-full')
    expect(pane.className).toContain('lg:shrink-0')
    const split = pane.parentElement
    expect(split).toBeTruthy()
    expect(split?.className).toContain(DROP_EDITOR_SPLIT_LG_MIN_H_CLASS)
  })

  it('scopes media controls under Basics campaign assets with no native <select>', async () => {
    renderDropEditor()

    await waitFor(() => {
      expect(screen.getByText(/campaign emblem/i)).toBeTruthy()
    })

    expect(document.querySelector('select')).toBeNull()
    expect(screen.getByText(/drop emblem/i)).toBeTruthy()
  })

  it('groups emblem and wordmark under Basics with no empty <img src> fallbacks', async () => {
    const base = createDefaultTheOathDrop()
    mockDropsState.drops = [
      {
        ...base,
        visuals: {
          ...base.visuals,
          emblemImageUrl: '',
          wordmarkImageUrl: '',
          heroImageUrl: '',
        },
      },
    ]
    renderDropEditor()

    const basics = await screen.findByRole('tab', { name: /basics/i })
    expect(basics).toBeTruthy()
    expect(screen.getByText(/wordmark/i)).toBeTruthy()
    expect(screen.queryByText(/hero backdrop/i)).toBeNull()

    const imgs = document.querySelectorAll('img')
    for (const el of Array.from(imgs)) {
      const src = el.getAttribute('src')
      expect(src == null || src.length > 0).toBe(true)
    }
  })
})
