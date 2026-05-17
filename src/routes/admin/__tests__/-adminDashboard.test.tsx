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
    expect(screen.getByRole('link', { name: /manage drops/i })).toBeTruthy()
  })

  it('labels the settings tile CTA as Settings', () => {
    render(<AdminDashboardPageRoute />)

    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link.getAttribute('href')).toBe('/admin/settings')
  })

  it('exposes card CTAs as links with destinations for every dashboard tile', () => {
    render(<AdminDashboardPageRoute />)

    for (const card of dashboardCards) {
      const link = screen.getByRole('link', { name: card.cta })
      expect(link.getAttribute('href')).toBe(card.href)
    }
  })
})
