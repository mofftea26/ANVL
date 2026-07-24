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
  DEFAULT_PASSPORT_CONTENT,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'

let storedConfig: PassportContentConfig = { ...DEFAULT_PASSPORT_CONTENT }
const listeners = new Set<() => void>()
const saveAsync = vi.fn()

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/features/cms/passportContent/passportContent.settings', () => ({
  readPassportContentFromStorage: () => storedConfig,
  subscribePassportContentChange: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  savePassportContentAsync: async (next: PassportContentConfig) => {
    saveAsync(next)
    storedConfig = next
    for (const listener of listeners) listener()
  },
}))

vi.mock('@/features/admin/hooks/useAdminProductCatalogQuery', () => ({
  useAdminProductCatalogQuery: () => ({
    data: { items: [{ slug: 'oath-tee', name: 'Oath Tee' }], drops: [] },
    isLoading: false,
  }),
}))

vi.mock('@/features/admin/media/useMediaAssetsQuery', () => ({
  useMediaAssetsQuery: () => ({ data: [], isLoading: false }),
}))

// The editor renders a `<Link>` back to the picker — stub it (no router here).
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
  }
})

function TopbarActionsProbe() {
  const actions = useAdminPageActionsSlot()
  return <div data-testid="admin-page-actions">{actions}</div>
}

async function renderEditor() {
  const { PassportContentTabsEditor } = await import('../PassportContentTabsEditor')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AdminPageActionsProvider>
        <TopbarActionsProbe />
        <PassportContentTabsEditor productSlug="oath-tee" />
      </AdminPageActionsProvider>
    </QueryClientProvider>,
  )
}

describe('PassportContentTabsEditor', () => {
  beforeEach(() => {
    storedConfig = { ...DEFAULT_PASSPORT_CONTENT }
    listeners.clear()
    saveAsync.mockReset()
  })

  it('renders the sections as a tablist (not a modal)', async () => {
    await renderEditor()
    const tablist = screen.getByRole('tablist', { name: 'Passport sections' })
    const tabs = within(tablist).getAllByRole('tab')
    expect(tabs.length).toBe(10)
    expect(within(tablist).getByRole('tab', { name: 'Identity' })).toBeTruthy()
    expect(within(tablist).getByRole('tab', { name: 'Fit & sizing' })).toBeTruthy()
    // The old modal wizard dialog must be gone.
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('edits a section and saves it into passport_content for the slug', async () => {
    const user = userEvent.setup()
    await renderEditor()

    // Identity is the default tab — its first textbox is the tagline.
    const tagline = screen.getAllByRole('textbox')[0]!
    await user.type(tagline, 'Forged under pressure')

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save passport/i }))

    await waitFor(() => {
      expect(saveAsync).toHaveBeenCalledTimes(1)
    })
    const saved = saveAsync.mock.calls[0]![0] as PassportContentConfig
    expect(saved['oath-tee']?.identity.tagline).toBe('Forged under pressure')
  })

  it('switches tabs and edits a different section', async () => {
    const user = userEvent.setup()
    await renderEditor()

    await user.click(screen.getByRole('tab', { name: 'Specifications' }))
    // Specs renders 6 plain inputs (Construction first); FormField labels aren't
    // wired via htmlFor, so target the first textbox in the now-active panel.
    const construction = screen.getAllByRole('textbox')[0]!
    await user.type(construction, 'Flatlock seams')

    const actions = within(screen.getByTestId('admin-page-actions'))
    await user.click(actions.getByRole('button', { name: /save passport/i }))

    await waitFor(() => expect(saveAsync).toHaveBeenCalled())
    const saved = saveAsync.mock.calls[0]![0] as PassportContentConfig
    expect(saved['oath-tee']?.specs.construction).toBe('Flatlock seams')
  })
})
