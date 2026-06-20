import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { adminNavItems } from '@/features/admin/components/adminNav'

import { AdminDashboardPageRoute } from '../-adminDashboard'

const dashboardCards = adminNavItems.filter((i) => i.href !== '/admin')

vi.mock('@/features/admin/auth/ProtectedAdminRoute', () => ({
  ProtectedAdminRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@/features/admin/components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Uses TanStack Query + Supabase fetches — out of scope for dashboard tile tests.
vi.mock('@/features/admin/landing-picker/LandingPagePickerCard', () => ({
  LandingPagePickerCard: () => null,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children?: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

describe('AdminDashboardPageRoute', () => {
  it('renders CMS cards without a duplicate workspace hero strip', () => {
    render(<AdminDashboardPageRoute />)

    expect(screen.queryByRole('heading', { name: /welcome back/i })).toBeNull()
    expect(screen.queryByText(/everything persists in this browser/i)).toBeNull()
    expect(screen.queryByRole('link', { name: /view site/i })).toBeNull()
    expect(screen.getByRole('link', { name: /manage/i })).toBeTruthy()
  })

  it('labels the settings tile CTA from nav config', () => {
    render(<AdminDashboardPageRoute />)

    const settingsLink = screen
      .getAllByRole('link', { name: 'Open' })
      .find((el) => el.getAttribute('href') === '/admin/settings')
    expect(settingsLink).toBeTruthy()
  })

  it('exposes card CTAs as links with destinations for every dashboard tile', () => {
    render(<AdminDashboardPageRoute />)

    for (const card of dashboardCards) {
      const links = screen.getAllByRole('link', { name: card.cta })
      const link = links.find((el) => el.getAttribute('href') === card.href)
      expect(link).toBeTruthy()
    }
  })
})
