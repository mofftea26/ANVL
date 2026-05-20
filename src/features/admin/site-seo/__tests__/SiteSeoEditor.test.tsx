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
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'
import { SiteSeoEditor } from '../SiteSeoEditor'

const saveAsync = vi.fn()
const siteSeo = defaultSiteSeoContent()
const flashSuccessMock = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: flashSuccessMock }),
}))

vi.mock('@/features/cms/siteSeo.local', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/cms/siteSeo.local')>()
  return {
    ...actual,
    getSiteSeoContent: () => siteSeo,
    saveSiteSeoContentAsync: (...args: unknown[]) => saveAsync(...args),
  }
})

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
      <SiteSeoEditor />
    </AdminPageActionsProvider>,
  )
}

describe('SiteSeoEditor', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(siteSeo)
  })

  it('renders SEO tabs and switches active panel', async () => {
    const user = userEvent.setup()
    renderEditor()

    expect(screen.getByRole('tab', { name: 'Defaults' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Pages' })).toBeTruthy()
    expect(screen.getByText('Global defaults')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Pages' }))
    expect(screen.getByText('Static pages')).toBeTruthy()
    expect(screen.queryByText('Global defaults')).toBeNull()
  })

  it('registers Save SEO in the admin topbar actions slot', async () => {
    const user = userEvent.setup()
    renderEditor()

    const actions = within(screen.getByTestId('admin-page-actions'))
    expect(actions.getByRole('button', { name: /save site seo/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /save seo/i })).toBeNull()

    await user.click(actions.getByRole('button', { name: /save site seo/i }))
    expect(saveAsync).toHaveBeenCalledWith(siteSeo)
  })
})
