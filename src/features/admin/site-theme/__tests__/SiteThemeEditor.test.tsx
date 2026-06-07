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
import { DEFAULT_THEME_CONFIG } from '@/features/cms/config/cmsSiteConfig.zod'
import { SiteThemeEditor } from '../SiteThemeEditor'

const saveAsync = vi.fn()
const flashSuccessMock = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: flashSuccessMock }),
}))

vi.mock('@/features/cms/config/cmsSiteConfig.settings', () => ({
  readThemeConfigFromStorage: () => DEFAULT_THEME_CONFIG,
  subscribeCmsSiteConfigChange: () => () => {},
  saveThemeConfigAsync: (...args: unknown[]) => saveAsync(...args),
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
    saveAsync.mockResolvedValue(undefined)
  })

  it('renders intro copy and theme mode selector', () => {
    renderEditor()
    expect(
      screen.getByText(/Colors apply site-wide via CSS variables/i),
    ).toBeTruthy()
    expect(screen.getByText('Theme mode')).toBeTruthy()
  })

  it('registers Save theme in the admin topbar actions slot', async () => {
    const user = userEvent.setup()
    renderEditor()

    const actions = within(screen.getByTestId('admin-page-actions'))
    const saveBtn = actions.getByRole('button', { name: /save theme/i })
    await user.click(saveBtn)
    expect(saveAsync).toHaveBeenCalled()
  })
})
