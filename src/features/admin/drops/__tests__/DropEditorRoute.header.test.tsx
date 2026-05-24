import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, beforeEach, expect, it, vi } from 'vitest'

import type { Drop } from '@/features/admin/drops/drops.types'
import { DropEditorRoute } from '@/features/admin/drops/DropEditorRoute'
import {
  DEFAULT_OATH_DROP_ID,
  createDefaultTheOathDrop,
} from '@/features/admin/drops/drops.defaults'
import { saveDrop } from '@/features/admin/drops/drops.service'
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

const activateMutate = vi.fn()
const deactivateMutate = vi.fn()

vi.mock('@/features/admin/drops/useAdminDropsListQuery', () => ({
  useSetActiveAdminDropMutation: () => ({
    mutate: activateMutate,
    isPending: false,
  }),
  useDeactivateAdminDropMutation: () => ({
    mutate: deactivateMutate,
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
  function LayoutProbe({
    title,
    description,
  }: {
    title?: string
    description?: ReactNode
  }) {
    const actions = useAdminPageActionsSlot()
    return (
      <header data-testid="layout-header-probe">
        <h1>{title}</h1>
        {description ? <div data-testid="layout-description">{description}</div> : null}
        <div data-testid="admin-page-actions">{actions}</div>
      </header>
    )
  }
  return {
    AdminLayout: ({
      children,
      title,
      description,
    }: {
      children?: ReactNode
      title?: string
      description?: ReactNode
    }) => (
      <div data-testid="admin-layout-stub">
        <LayoutProbe title={title} description={description} />
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

vi.mock('@/features/admin/drops/drops.service', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/features/admin/drops/drops.service')>()
  return {
    ...mod,
    saveDrop: vi.fn(mod.saveDrop),
  }
})

function renderDropEditor() {
  return render(
    <AdminPageActionsProvider>
      <DropEditorRoute dropId={DEFAULT_OATH_DROP_ID} />
    </AdminPageActionsProvider>,
  )
}

describe('DropEditorRoute top bar actions', () => {
  beforeEach(() => {
    mockDropsState.drops = [createDefaultTheOathDrop()]
    vi.mocked(saveDrop).mockClear()
    activateMutate.mockClear()
    deactivateMutate.mockClear()
  })

  it('shows a single Live badge when the drop is storefront-active (no duplicate status)', async () => {
    renderDropEditor()

    await waitFor(() => {
      expect(screen.getByTestId('layout-description')).toBeTruthy()
    })

    const description = screen.getByTestId('layout-description')
    expect(within(description).getByText(/^live$/i)).toBeTruthy()
    expect(within(description).queryByText(/^active drop$/i)).toBeNull()
    expect(within(description).queryByText(/^active$/i)).toBeNull()
  })

  it('shows CMS status only when the drop is not live on storefront', async () => {
    const drop = createDefaultTheOathDrop()
    drop.isActive = false
    drop.status = 'inactive'
    mockDropsState.drops = [drop]

    renderDropEditor()

    await waitFor(() => {
      expect(within(screen.getByTestId('layout-description')).getByText(/^inactive$/i)).toBeTruthy()
    })
    expect(within(screen.getByTestId('layout-description')).queryByText(/^live$/i)).toBeNull()
  })

  it('registers Activate / Reset / Delete / Save chip controls (no duplicate section header)', async () => {
    renderDropEditor()

    await waitFor(() => {
      expect(
        screen.getByTestId('admin-page-actions').querySelectorAll('button').length,
      ).toBeGreaterThanOrEqual(4)
    })

    expect(
      within(screen.getByTestId('layout-header-probe')).queryByRole('heading', {
        level: 2,
      }),
    ).toBeNull()
    expect(screen.queryByText('Drop editor')).toBeNull()

    expect(
      screen.getByRole('button', {
        name: /^(activate|deactivate) drop on storefront$/i,
      }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: /^reset drop$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^delete drop$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^save drop$/i })).toBeTruthy()

    expect(screen.queryByText(/Preview-centric/i)).toBeNull()
    expect(screen.queryByRole('link', { name: /live route/i })).toBeNull()
  })

  it('opens deactivate confirm dialog when the drop is live on storefront', async () => {
    const user = userEvent.setup()
    renderDropEditor()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^deactivate drop on storefront$/i }),
      ).toBeTruthy()
    })

    await user.click(
      screen.getByRole('button', { name: /^deactivate drop on storefront$/i }),
    )
    expect(screen.getByRole('dialog', { name: /deactivate drop/i })).toBeTruthy()
  })

  it('places below-xl live preview Hide/Show on the preview card header row', async () => {
    const user = userEvent.setup()
    renderDropEditor()

    await user.click(screen.getByRole('tab', { name: /^theme$/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^hide live preview$/i }),
      ).toBeTruthy()
    })

    const previewToolbar = screen.getByRole('toolbar', {
      name: /preview viewport size/i,
    })
    expect(previewToolbar.className.includes('hidden')).toBe(false)

    await user.click(screen.getByRole('button', { name: /^hide live preview$/i }))
    expect(previewToolbar.className.includes('hidden')).toBe(true)

    await user.click(screen.getByRole('button', { name: /^show live preview$/i }))
    await waitFor(() => {
      expect(previewToolbar.className.includes('hidden')).toBe(false)
    })
  })

  it('Basics tab includes campaign asset pickers (no native select)', async () => {
    renderDropEditor()

    await waitFor(() => {
      expect(screen.getByText(/campaign assets/i)).toBeTruthy()
    })

    expect(document.querySelector('select')).toBeNull()
  })

  it('shows document title as Untitled when the drop name is blank', async () => {
    const drop = createDefaultTheOathDrop()
    drop.name = '   '
    mockDropsState.drops = [drop]

    renderDropEditor()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Untitled' })).toBeTruthy()
    })
  })

  it('confirms via Modal before committing saveDrop', async () => {
    const user = userEvent.setup()
    renderDropEditor()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^save drop$/i })).toBeTruthy()
    })

    expect(
      screen.queryByRole('checkbox', { name: /activate this drop after saving/i }),
    ).toBeNull()

    await user.click(screen.getByRole('button', { name: /^save drop$/i }))
    const dialog = screen.getByRole('dialog', { name: /commit changes to storage/i })
    expect(dialog).toBeTruthy()

    const activateCheckbox = within(dialog).getByRole('checkbox', {
      name: /activate this drop after saving/i,
    }) as HTMLInputElement
    expect(activateCheckbox.checked).toBe(false)

    await user.click(within(dialog).getByRole('button', { name: /^save$/i }))
    await waitFor(() => {
      expect(vi.mocked(saveDrop)).toHaveBeenCalled()
    })
    expect(vi.mocked(saveDrop).mock.calls[0][1]).toEqual({ makeActive: false })
  })

  it('passes makeActive when activate-after-save is checked in the save modal', async () => {
    const user = userEvent.setup()
    renderDropEditor()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^save drop$/i })).toBeTruthy()
    })

    await user.click(screen.getByRole('button', { name: /^save drop$/i }))
    const dialog = screen.getByRole('dialog', { name: /commit changes to storage/i })
    await user.click(
      within(dialog).getByRole('checkbox', { name: /activate this drop after saving/i }),
    )
    await user.click(within(dialog).getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(vi.mocked(saveDrop).mock.calls[0][1]).toEqual({ makeActive: true })
    })
  })

  it(
    're-opens save modal with activate-after-save pre-checked after it was saved on',
    async () => {
      const user = userEvent.setup()
      renderDropEditor()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^save drop$/i })).toBeTruthy()
      })

      await user.click(screen.getByRole('button', { name: /^save drop$/i }))
      let dialog = screen.getByRole('dialog', {
        name: /commit changes to storage/i,
      })
      await user.click(
        within(dialog).getByRole('checkbox', {
          name: /activate this drop after saving/i,
        }),
      )
      await user.click(within(dialog).getByRole('button', { name: /^save$/i }))

      await waitFor(() => {
        expect(vi.mocked(saveDrop)).toHaveBeenCalledTimes(1)
      })
      vi.mocked(saveDrop).mockClear()

      await user.click(screen.getByRole('button', { name: /^save drop$/i }))
      await waitFor(() => {
        expect(
          screen.getByRole('dialog', { name: /commit changes to storage/i }),
        ).toBeTruthy()
      })
      dialog = screen.getByRole('dialog', { name: /commit changes to storage/i })
      await waitFor(() => {
        expect(
          (
            within(dialog).getByRole('checkbox', {
              name: /activate this drop after saving/i,
            }) as HTMLInputElement
          ).checked,
        ).toBe(true)
      })
    },
    10_000,
  )
})
