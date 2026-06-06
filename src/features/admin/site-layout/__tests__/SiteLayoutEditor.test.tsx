/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdminPageActionsProvider,
  useAdminPageActionsSlot,
} from '@/features/admin/components/AdminPageActionsContext'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { SiteLayoutEditor } from '../SiteLayoutEditor'

const saveAsync = vi.fn()
const layout = createDefaultWebsiteLayout()
const getSaveError = vi.fn(() => null as string | null)
const flashSuccessMock = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: flashSuccessMock }),
}))

vi.mock('@/features/admin/website-layout/websiteLayout.service', () => ({
  getWebsiteLayoutContent: () => layout,
  getWebsiteLayoutSaveError: () => getSaveError(),
  saveWebsiteLayoutContentAsync: (...args: unknown[]) => saveAsync(...args),
}))

const saveHomeExtrasAsync = vi.fn()

vi.mock('@/features/admin/site-home/siteHome.service', () => ({
  getSiteHomeExtrasContent: () => ({
    campaigns: [],
    lookbook: [],
    updatedAt: '2026-05-20T00:00:00.000Z',
  }),
  saveSiteHomeExtrasContentAsync: (...args: unknown[]) => saveHomeExtrasAsync(...args),
}))

vi.mock('@/shared/components/ui/MediaPickerField', () => ({
  MediaPickerField: ({ label }: { label: string }) => (
    <div data-testid={`media-${label}`} />
  ),
}))

function TopbarActionsProbe() {
  const actions = useAdminPageActionsSlot()
  return <div data-testid="admin-page-actions">{actions}</div>
}

function renderEditor() {
  return render(
    <AdminPageActionsProvider>
      <TopbarActionsProbe />
      <SiteLayoutEditor />
    </AdminPageActionsProvider>,
  )
}

describe('SiteLayoutEditor', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(layout)
    saveHomeExtrasAsync.mockReset()
    saveHomeExtrasAsync.mockResolvedValue({
      campaigns: [],
      lookbook: [],
      updatedAt: '2026-05-20T00:00:00.000Z',
    })
    getSaveError.mockReturnValue(null)
  })

  it('renders layout tabs and switches active panel', async () => {
    const user = userEvent.setup()
    renderEditor()

    expect(screen.getByRole('tab', { name: 'Header' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Footer' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Announcement' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Home extras' })).toBeTruthy()

    expect(screen.getByText('Header & navigation')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Footer' }))
    expect(screen.getByText('Footer groups')).toBeTruthy()
    expect(screen.queryByText('Header & navigation')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Announcement' }))
    expect(screen.getByText('Announcement bar')).toBeTruthy()
  })

  it('registers Save layout in the admin topbar and saves', async () => {
    const user = userEvent.setup()
    renderEditor()

    const preview = screen.getByTestId('site-layout-preview')
    const nav = within(preview).getByTestId('site-layout-preview-nav')
    expect(within(nav).getByText('The Oath')).toBeTruthy()

    const actions = within(screen.getByTestId('admin-page-actions'))
    const saveBtn = actions.getByRole('button', { name: /save website layout/i })
    expect(saveBtn).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^save layout$/i })).toBeNull()

    await user.click(saveBtn)
    expect(saveAsync).toHaveBeenCalledWith(layout)
    expect(saveHomeExtrasAsync).toHaveBeenCalled()
  })

  it('shows home extras editor on Home extras tab', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('tab', { name: 'Home extras' }))
    expect(screen.getByTestId('site-home-extras-editor')).toBeTruthy()
  })

  it('shows inline validation error and disables topbar save', () => {
    getSaveError.mockReturnValue('Header needs at least one link.')
    renderEditor()

    expect(screen.getByTestId('site-layout-save-error')).toHaveTextContent(
      'Header needs at least one link.',
    )

    const actions = within(screen.getByTestId('admin-page-actions'))
    expect(
      actions.getByRole('button', { name: /save blocked by validation errors/i }),
    ).toBeDisabled()
  })
})
