/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
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
const oathPalette = {
  id: 'oath-dark',
  name: 'The Oath',
  colors: {
    background: '#0B0B0C',
    surface: '#1D1F21',
    surfaceSoft: '#34373A',
    heading: '#E7E4DF',
    text: '#E7E4DF',
    mutedText: '#5B5E61',
    line: '#34373A',
    accent: '#C4A574',
    accentSoft: '#3d3528',
    heroGlow: '#1a1510',
  },
}

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children?: ReactNode
    className?: string
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: flashSuccessMock }),
}))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => null,
}))

vi.mock('@/features/admin/drops/drops.service', () => ({
  ensureDropSystemHydrated: vi.fn(),
  getActiveDrop: () => ({
    title: 'The Oath',
    slug: 'the-oath',
    theme: oathPalette,
  }),
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

  it('renders hero, emblem tiles, and active drop palette', () => {
    renderEditor()

    expect(
      screen.getByText('These show before the active drop loads.'),
    ).toBeTruthy()
    expect(screen.getByTestId('media-Default emblem')).toBeTruthy()
    expect(screen.getByTestId('media-Loading emblem')).toBeTruthy()
    expect(screen.getByText('Active drop palette')).toBeTruthy()
    expect(screen.getByTestId('active-drop-palette-swatches')).toBeTruthy()
    expect(screen.getByText('The Oath')).toBeTruthy()
    expect(screen.getByRole('link', { name: /edit drop theme/i })).toBeTruthy()
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
