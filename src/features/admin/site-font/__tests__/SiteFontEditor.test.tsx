/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdminPageActionsProvider,
  useAdminPageActionsSlot,
} from '@/features/admin/components/AdminPageActionsContext'
import {
  DEFAULT_FONT_LIBRARY_CONFIG,
  type FontLibraryConfig,
} from '@/features/cms/config/fontLibrary'

// Mutable "persisted" store the settings mock serves; `saveFontConfigAsync`
// commits the working copy here and notifies subscribers — mirroring the real
// write-then-event flow so the component's `stored` read updates after save.
let storedConfig: FontLibraryConfig = DEFAULT_FONT_LIBRARY_CONFIG
const listeners = new Set<() => void>()
const saveAsync = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/cms/config/cmsSiteConfig.settings', () => ({
  readFontLibraryFromStorage: () => storedConfig,
  subscribeCmsSiteConfigChange: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  saveFontConfigAsync: async (next: FontLibraryConfig) => {
    saveAsync(next)
    storedConfig = next
    for (const listener of listeners) listener()
  },
}))

function TopbarActionsProbe() {
  const actions = useAdminPageActionsSlot()
  return <div data-testid="admin-page-actions">{actions}</div>
}

async function renderEditor() {
  const { SiteFontEditor } = await import('../SiteFontEditor')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AdminPageActionsProvider>
        <TopbarActionsProbe />
        <SiteFontEditor />
      </AdminPageActionsProvider>
    </QueryClientProvider>,
  )
}

describe('SiteFontEditor (F1 — active font indication)', () => {
  beforeEach(() => {
    storedConfig = DEFAULT_FONT_LIBRARY_CONFIG
    listeners.clear()
    saveAsync.mockReset()
  })

  function roleCaptionText(roleLabel: string): string {
    // Captions are wired to their selects via aria-describedby (accessibility
    // requirement) — resolve each caption through that linkage.
    const trigger = screen.getByRole('combobox', { name: roleLabel })
    const describedBy = trigger.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    return document.getElementById(describedBy!)?.textContent ?? ''
  }

  it('shows an Active caption per role reflecting the SAVED assignment', async () => {
    await renderEditor()

    expect(roleCaptionText('Body (sans)')).toContain('Active: Sora')
    expect(roleCaptionText('Headings')).toContain('Active: Anton')
    expect(roleCaptionText('Display accent')).toContain('Active: Cinzel')
    expect(screen.queryByText(/unsaved change/i)).toBeNull()
  })

  it('shows an unsaved-change chip when a role diverges from the saved assignment', async () => {
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('combobox', { name: 'Body (sans)' }))
    // The saved-active option is marked inside the dropdown.
    expect(screen.getByRole('option', { name: /Sora.*Active/ })).toBeTruthy()
    await user.click(screen.getByRole('option', { name: /^Anton/ }))

    expect(screen.getByText(/unsaved change/i)).toBeTruthy()
    // Caption still reflects the SAVED font, not the pending pick.
    expect(roleCaptionText('Body (sans)')).toContain('Active: Sora')
  })

  it('updates the Active caption after a (mocked) save commits the change', async () => {
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('combobox', { name: 'Body (sans)' }))
    await user.click(screen.getByRole('option', { name: /^Anton/ }))
    expect(screen.getByText(/unsaved change/i)).toBeTruthy()

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save fonts/i }))

    await waitFor(() => {
      expect(saveAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sans: 'builtin-anton' }),
      )
      // stored now matches the working copy — chip gone, caption updated.
      expect(screen.queryByText(/unsaved change/i)).toBeNull()
    })
    expect(storedConfig.sans).toBe('builtin-anton')
    // The Body caption now names Anton as the active family.
    const sansTrigger = screen.getByRole('combobox', { name: 'Body (sans)' })
    const describedBy = sansTrigger.getAttribute('aria-describedby')
    expect(document.getElementById(describedBy!)?.textContent).toContain('Anton')
  })
})
