import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { adminNavItems } from '@/features/admin/components/adminNav'
import {
  readComingSoonConfigFromStorage,
  writeComingSoonConfigToStorage,
} from '@/features/cms/comingSoon/comingSoon.settings'
import { LANDING_CONTENT_STORAGE_KEY } from '@/features/cms/landingContent/landingContent.settings'

import { AdminDashboardPageRoute } from '../-adminDashboard'

const launcherItems = adminNavItems.filter((i) => i.href !== '/admin')

const WIZARD_LABELS = [
  'Drop setup',
  'Products',
  'Story',
  'About page',
  'Passports',
  'Gamification',
]

vi.mock('@/features/admin/components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Hits Supabase (landing_pages) — out of scope for dashboard rendering tests.
vi.mock('@/features/admin/landing-picker/fetchLandingPagePickerOptions', () => ({
  fetchLandingPagePickerOptions: () => Promise.resolve([]),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    search,
    children,
    ...rest
  }: {
    to: string
    search?: Record<string, string>
    children?: React.ReactNode
    [key: string]: unknown
  }) => (
    <a
      href={search ? `${to}?${new URLSearchParams(search).toString()}` : to}
      {...rest}
    >
      {children}
    </a>
  ),
}))

/** Setup wizards now run inline editors backed by React Query (media, catalog,
 *  gamification rules), so the dashboard needs the same provider the app has. */
function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminDashboardPageRoute />
    </QueryClientProvider>,
  )
}

describe('AdminDashboardPageRoute', () => {
  it('exposes every admin surface as a launcher link', () => {
    renderDashboard()

    const hrefs = screen
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'))

    for (const item of launcherItems) {
      expect(hrefs).toContain(item.href)
    }
  })

  it('labels launcher tiles with the nav item name', () => {
    renderDashboard()

    for (const item of launcherItems) {
      const links = screen.getAllByRole('link', {
        name: new RegExp(item.label, 'i'),
      })
      expect(
        links.some((el) => el.getAttribute('href') === item.href),
      ).toBe(true)
    }
  })

  it('shows the clickable active drop tile without a storefront link or Coming Soon warning', () => {
    renderDashboard()

    // The tile is now a button that opens the drop status modal.
    expect(screen.getByRole('button', { name: /active drop/i })).toBeTruthy()
    // "View storefront" chrome moved to the sidebar footer only (D2).
    expect(screen.queryByRole('link', { name: /view storefront/i })).toBeNull()
    expect(screen.queryByText(/coming soon is live/i)).toBeNull()
  })

  it('shows the Coming Soon warning pill while the reveal mode is enabled', () => {
    writeComingSoonConfigToStorage({
      ...readComingSoonConfigFromStorage(),
      enabled: true,
    })
    renderDashboard()

    expect(screen.getByText(/coming soon is live/i)).toBeTruthy()
    const manage = screen.getByRole('link', { name: /manage/i })
    expect(manage.getAttribute('href')).toBe('/admin/coming-soon')
  })

  it('renders one button per setup wizard', () => {
    renderDashboard()

    for (const label of WIZARD_LABELS) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') }),
      ).toBeTruthy()
    }
  })

  it('opens the Drop setup wizard modal with its steps and an inline activation form', () => {
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /drop setup/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(screen.getByRole('heading', { name: /drop setup/i })).toBeTruthy()
    // Step rail present with the four steps.
    for (const step of ['Active page', 'Drop media', 'Landing copy', 'Review']) {
      expect(
        screen.getByRole('button', { name: new RegExp(step, 'i') }),
      ).toBeTruthy()
    }
    // Step 1 embeds the real activation control, not just a deep link.
    expect(screen.getByRole('button', { name: /^activate$/i })).toBeTruthy()
  })

  it('edits and persists landing copy inline from the Drop wizard', async () => {
    window.localStorage.removeItem(LANDING_CONTENT_STORAGE_KEY)
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /drop setup/i }))
    fireEvent.click(screen.getByRole('button', { name: /3\. landing copy/i }))

    // The hero headline field shows the designed default as its placeholder.
    const headline = screen.getByPlaceholderText('Forged Under Pressure')
    fireEvent.change(headline, { target: { value: 'Struck From Iron' } })
    fireEvent.click(screen.getByRole('button', { name: /save landing copy/i }))

    // Saving writes the CMS working copy (the same blob the real editor saves).
    await waitFor(() => {
      const raw = window.localStorage.getItem(LANDING_CONTENT_STORAGE_KEY)
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw as string) as {
        'the-oath'?: { hero?: { headline?: string } }
      }
      expect(parsed['the-oath']?.hero?.headline).toBe('Struck From Iron')
    })
  })

  it('embeds the About asset slots inline and keeps a fine-tune deep link', () => {
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /^about page/i }))
    fireEvent.click(screen.getByRole('button', { name: /3\. assets/i }))

    // Real slot controls render inside the modal (About defines its slots in code).
    expect(screen.getByText('Anvil 3D model (GLB)')).toBeTruthy()
    expect(screen.getByRole('button', { name: /save about assets/i })).toBeTruthy()

    // The library deep link survives as a small secondary action and closes on navigate.
    const assetsLink = screen.getByRole('link', { name: /library in assets/i })
    expect(assetsLink.getAttribute('href')).toBe('/admin/assets?page=about')
    fireEvent.click(assetsLink)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
