import type { ReactNode } from 'react'

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminSidebar } from '@/features/admin/components/AdminSidebar'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'

const { mockLogout } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children?: ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useRouterState: (opts: { select: (s: { location: { pathname: string } }) => string }) =>
    opts.select({ location: { pathname: '/admin' } }),
}))

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    logout: mockLogout,
    session: {
      kind: 'supabase' as const,
      email: 'editor@anvl.test',
      userId: 'u1',
      displayName: 'Editor',
      loggedInAt: '2026-01-01T00:00:00.000Z',
    },
  }),
}))

describe('AdminSidebar', () => {
  beforeEach(() => {
    mockLogout.mockClear()
    window.localStorage.clear()
  })

  it('renders categorized nav sections without badge pills', async () => {
    const user = userEvent.setup()
    render(<AdminSidebar />)

    expect(screen.getByText('ANVL Studio')).toBeInTheDocument()
    expect(screen.getByText('Forge control room')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument()

    const dashboard = screen.getByRole('link', { name: /Dashboard/i })
    expect(dashboard).toHaveAttribute('aria-current', 'page')

    // Category headers are collapsible buttons now. (Passports is both a
    // header and a link label.)
    for (const category of ['Design', 'Content', 'Commerce', 'Media']) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${category}$`, 'i') }),
      ).toBeInTheDocument()
    }

    // Old badge pills stay gone.
    for (const badge of ['Type', 'QR', 'Saga']) {
      expect(screen.queryByText(badge)).not.toBeInTheDocument()
    }

    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()

    expect(screen.getByText('editor@anvl.test')).toBeInTheDocument()

    // The sidebar footer KEEPS the storefront jump (removed everywhere else).
    const storefrontLink = screen.getByRole('link', { name: /storefront/i })
    expect(storefrontLink).toHaveAttribute('href', '/')
    expect(storefrontLink).toHaveAttribute('target', '_blank')

    // Sign out asks for confirmation first, then logs out.
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(mockLogout).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /sign out/i }))
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('collapses and expands a category section, persisting the preference', async () => {
    const user = userEvent.setup()
    render(<AdminSidebar />)

    // Expanded by default — the Design links are visible.
    expect(screen.getByRole('link', { name: /Theme & Colors/i })).toBeInTheDocument()

    const designHeader = screen.getByRole('button', { name: /^Design$/i })
    expect(designHeader).toHaveAttribute('aria-expanded', 'true')

    await user.click(designHeader)
    expect(designHeader).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: /Theme & Colors/i })).not.toBeInTheDocument()
    // Other categories stay open.
    expect(screen.getByRole('link', { name: /Story/i })).toBeInTheDocument()

    // Preference persists (Design absent from the stored expanded set).
    const stored = JSON.parse(
      window.localStorage.getItem(ADMIN_STORAGE_KEYS.sidebarCats) ?? '[]',
    ) as string[]
    expect(stored).not.toContain('Design')
    expect(stored).toContain('Content')

    await user.click(designHeader)
    expect(screen.getByRole('link', { name: /Theme & Colors/i })).toBeInTheDocument()
  })

  it('rail density renders one accessible icon link per category', () => {
    render(<AdminSidebar density="rail" onToggleCollapse={() => {}} />)

    expect(screen.getByRole('button', { name: /expand navigation/i })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Admin' })

    // Multi-editor categories land on their category page…
    expect(
      within(nav).getByRole('link', { name: /^Design$/i }).getAttribute('href'),
    ).toBe('/admin/category/design')
    expect(
      within(nav).getByRole('link', { name: /^Content$/i }).getAttribute('href'),
    ).toBe('/admin/category/content')
    // …single-editor categories deep-link straight to their editor.
    expect(
      within(nav).getByRole('link', { name: /^Dashboard$/i }).getAttribute('href'),
    ).toBe('/admin')
    expect(
      within(nav).getByRole('link', { name: /^Passports$/i }).getAttribute('href'),
    ).toBe('/admin/passports')

    // No per-item links in the rail — one control per category.
    expect(within(nav).queryByRole('link', { name: /Theme & Colors/i })).toBeNull()
  })

  it('shows a close control in drawer density and calls onNavigate', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()

    render(<AdminSidebar density="drawer" onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: /close navigation/i }))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('calls onNavigate when density is drawer and storefront link is activated', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()

    render(<AdminSidebar density="drawer" onNavigate={onNavigate} />)

    await user.click(screen.getByRole('link', { name: /storefront/i }))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
