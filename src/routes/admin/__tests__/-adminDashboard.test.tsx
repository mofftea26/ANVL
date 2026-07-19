import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { adminNavItems } from '@/features/admin/components/adminNav'
import {
  readComingSoonConfigFromStorage,
  writeComingSoonConfigToStorage,
} from '@/features/cms/comingSoon/comingSoon.settings'

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

describe('AdminDashboardPageRoute', () => {
  it('exposes every admin surface as a launcher link', () => {
    render(<AdminDashboardPageRoute />)

    const hrefs = screen
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'))

    for (const item of launcherItems) {
      expect(hrefs).toContain(item.href)
    }
  })

  it('labels launcher tiles with the nav item name', () => {
    render(<AdminDashboardPageRoute />)

    for (const item of launcherItems) {
      const links = screen.getAllByRole('link', {
        name: new RegExp(item.label, 'i'),
      })
      expect(
        links.some((el) => el.getAttribute('href') === item.href),
      ).toBe(true)
    }
  })

  it('shows the active drop tile and a storefront link, but no Coming Soon warning by default', () => {
    render(<AdminDashboardPageRoute />)

    expect(screen.getByText(/active drop/i)).toBeTruthy()
    const storefront = screen.getByRole('link', { name: /view storefront/i })
    expect(storefront.getAttribute('href')).toBe('/')
    expect(screen.queryByText(/coming soon is live/i)).toBeNull()
  })

  it('shows the Coming Soon warning pill while the reveal mode is enabled', () => {
    writeComingSoonConfigToStorage({
      ...readComingSoonConfigFromStorage(),
      enabled: true,
    })
    render(<AdminDashboardPageRoute />)

    expect(screen.getByText(/coming soon is live/i)).toBeTruthy()
    const manage = screen.getByRole('link', { name: /manage/i })
    expect(manage.getAttribute('href')).toBe('/admin/coming-soon')
  })

  it('renders one button per setup wizard', () => {
    render(<AdminDashboardPageRoute />)

    for (const label of WIZARD_LABELS) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') }),
      ).toBeTruthy()
    }
  })

  it('opens the Drop setup wizard modal with its steps and deep links', () => {
    render(<AdminDashboardPageRoute />)

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
  })

  it('deep-links a wizard step into its editor and closes on navigate', () => {
    render(<AdminDashboardPageRoute />)

    fireEvent.click(screen.getByRole('button', { name: /^about page/i }))
    fireEvent.click(screen.getByRole('button', { name: /3\. assets/i }))

    const assetsLink = screen.getByRole('link', { name: /open about assets/i })
    expect(assetsLink.getAttribute('href')).toBe('/admin/assets?page=about')

    fireEvent.click(assetsLink)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
