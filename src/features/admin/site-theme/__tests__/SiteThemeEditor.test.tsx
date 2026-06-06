/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdminPageActionsProvider,
  useAdminPageActionsSlot,
} from '@/features/admin/components/AdminPageActionsContext'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import { SiteThemeEditor } from '../SiteThemeEditor'

const saveAsync = vi.fn()
const defaultSettings = createDefaultGlobalBrandSettings()
const flashSuccessMock = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: flashSuccessMock }),
}))

vi.mock('@/features/admin/global-brand/globalBrand.service', () => ({
  getGlobalBrandSettings: () => defaultSettings,
  saveGlobalBrandSettingsAsync: (...args: unknown[]) => saveAsync(...args),
}))

vi.mock('@/features/admin/global-brand/globalBrand.storage', () => ({
  subscribeGlobalBrandChange: () => () => {},
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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AdminPageActionsProvider>
        <TopbarActionsProbe />
        <SiteThemeEditor />
      </AdminPageActionsProvider>
    </QueryClientProvider>,
  )
}

describe('SiteThemeEditor', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(defaultSettings)
  })

  it('renders intro copy and emblem fallback tiles', () => {
    renderEditor()

    expect(
      screen.getByText(/Global brand fallbacks shown before page assets load\./i),
    ).toBeTruthy()
    expect(screen.getByTestId('media-Default emblem')).toBeTruthy()
    expect(screen.getByTestId('media-Loading emblem')).toBeTruthy()
  })

  it('registers Save fallbacks in the admin topbar actions slot', async () => {
    const user = userEvent.setup()
    renderEditor()

    const actions = within(screen.getByTestId('admin-page-actions'))
    const saveBtn = actions.getByRole('button', { name: /save brand fallbacks/i })
    expect(saveBtn).toBeTruthy()
    expect(screen.queryByRole('button', { name: /save fallbacks/i })).toBeNull()

    await user.click(saveBtn)
    expect(saveAsync).toHaveBeenCalledWith(defaultSettings)
  })
})
