/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import {
  AdminPageActionsProvider,
  useAdminPageActionsSlot,
} from '@/features/admin/components/AdminPageActionsContext'
import { DEFAULT_THEME_LIBRARY } from '@/features/cms/config/themeLibrary'
import type { ThemeLibraryConfig } from '@/features/cms/config/themeLibrary'
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
  readThemeLibraryFromStorage: () => DEFAULT_THEME_LIBRARY,
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

const houseName = DEFAULT_THEME_LIBRARY.themes[0].name

describe('SiteThemeEditor', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(undefined)
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it('renders intro copy, component preview, and contrast report', () => {
    renderEditor()
    expect(screen.getByText(/Graphite & Champagne house preset/i)).toBeTruthy()
    expect(screen.getByTestId('theme-component-preview')).toBeTruthy()
    expect(screen.getByTestId('theme-contrast-report')).toBeTruthy()
  })

  it('registers the icon-only Save theme action in the admin topbar slot', async () => {
    const user = userEvent.setup()
    renderEditor()

    const actions = within(screen.getByTestId('admin-page-actions'))
    const saveBtn = actions.getByRole('button', { name: /save theme/i })
    await user.click(saveBtn)
    await waitFor(() => expect(saveAsync).toHaveBeenCalled())
  })

  it('B6: creates a theme through the prompt dialog (no window.prompt)', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('button', { name: /new theme/i }))
    // Scoped to the dialog: the editor behind it has its own "Theme name"
    // field, and BOTH are now properly label-associated (they were not before
    // FormField auto-wired htmlFor), so an unscoped query is ambiguous.
    const nameInput = within(screen.getByRole('dialog')).getByLabelText(/theme name/i, {
      selector: 'input',
    })
    await user.clear(nameInput)
    await user.type(nameInput, 'Midnight Bronze')
    await user.click(screen.getByRole('button', { name: /create theme/i }))

    // The new preset is now the one being edited.
    expect(screen.getByDisplayValue('Midnight Bronze')).toBeTruthy()
    // …but it is NOT live — the editing-vs-live hint appears (E4/E6).
    expect(screen.getByText(/not the live theme/i)).toBeTruthy()
  })

  it('E4/E6: "Make this the live theme" + save persists the new activeThemeId', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('button', { name: /new theme/i }))
    // Scoped to the dialog: the editor behind it has its own "Theme name"
    // field, and BOTH are now properly label-associated (they were not before
    // FormField auto-wired htmlFor), so an unscoped query is ambiguous.
    const nameInput = within(screen.getByRole('dialog')).getByLabelText(/theme name/i, {
      selector: 'input',
    })
    await user.clear(nameInput)
    await user.type(nameInput, 'Midnight Bronze')
    await user.click(screen.getByRole('button', { name: /create theme/i }))

    await user.click(screen.getByRole('button', { name: /make this the live theme/i }))
    // Hint disappears once the edited preset is the live one.
    expect(screen.queryByText(/not the live theme/i)).toBeNull()

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save theme/i }))

    await waitFor(() => expect(saveAsync).toHaveBeenCalledTimes(1))
    const saved = saveAsync.mock.calls[0][0] as ThemeLibraryConfig
    const created = saved.themes.find((t) => t.name === 'Midnight Bronze')
    expect(created).toBeTruthy()
    expect(saved.activeThemeId).toBe(created!.id)
  })

  it('E4/E6: save toast states which theme is live', async () => {
    const user = userEvent.setup()
    renderEditor()

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save theme/i }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining(`Saved — live theme: ${houseName}`),
      ),
    )
  })

  it('E4/E6: a save-layer failure surfaces as an error toast', async () => {
    saveAsync.mockRejectedValue(
      new Error('Not saved to Supabase — your session may have expired.'),
    )
    const user = userEvent.setup()
    renderEditor()

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save theme/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Not saved to Supabase — your session may have expired.',
      ),
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('B6: deletes a theme through the confirm dialog', async () => {
    const user = userEvent.setup()
    renderEditor()

    // Create a second theme so delete is allowed, then delete it.
    await user.click(screen.getByRole('button', { name: /new theme/i }))
    // Scoped to the dialog: the editor behind it has its own "Theme name"
    // field, and BOTH are now properly label-associated (they were not before
    // FormField auto-wired htmlFor), so an unscoped query is ambiguous.
    const nameInput = within(screen.getByRole('dialog')).getByLabelText(/theme name/i, {
      selector: 'input',
    })
    await user.clear(nameInput)
    await user.type(nameInput, 'Disposable')
    await user.click(screen.getByRole('button', { name: /create theme/i }))
    expect(screen.getByDisplayValue('Disposable')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /delete theme/i }))
    expect(screen.getByText(/Delete “Disposable”\?/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    // Editing falls back to the house preset; the deleted theme is gone.
    expect(screen.queryByDisplayValue('Disposable')).toBeNull()
    expect(screen.getByDisplayValue(houseName)).toBeTruthy()
  })
})
