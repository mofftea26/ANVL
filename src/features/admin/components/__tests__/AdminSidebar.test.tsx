import type { ReactNode } from 'react'



import { render, screen, within } from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import { beforeEach, describe, expect, it, vi } from 'vitest'



import { AdminSidebar } from '@/features/admin/components/AdminSidebar'



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

  })



  it('renders categorized nav sections without badge pills', async () => {

    const user = userEvent.setup()

    render(<AdminSidebar />)



    expect(screen.getByText('ANVL Studio')).toBeInTheDocument()

    expect(screen.getByText('Forge control room')).toBeInTheDocument()

    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument()



    const dashboard = screen.getByRole('link', { name: /Dashboard/i })

    expect(dashboard).toHaveAttribute('aria-current', 'page')

    expect(dashboard.className).toContain('rounded-lg')

    expect(dashboard.className).not.toContain('rounded-full')



    // Category eyebrows — the new IA grouping. (getAllByText: "Passports" is
    // both an eyebrow and a link label.)
    for (const category of ['Design', 'Content', 'Commerce', 'Passports', 'Media']) {
      expect(screen.getAllByText(category).length).toBeGreaterThanOrEqual(1)
    }

    // Old badge pills stay gone.
    for (const badge of ['Type', 'QR', 'Saga']) {
      expect(screen.queryByText(badge)).not.toBeInTheDocument()
    }

    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()



    expect(screen.getByText('editor@anvl.test')).toBeInTheDocument()



    const storefrontLink = screen.getByRole('link', { name: /storefront/i })

    expect(storefrontLink).toHaveAttribute('href', '/')

    expect(storefrontLink).toHaveAttribute('target', '_blank')



    // Sign out asks for confirmation first, then logs out (the redirect that
    // follows is a jsdom no-op — asserted via the logout call, which precedes it).
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(mockLogout).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /sign out/i }))
    expect(mockLogout).toHaveBeenCalledTimes(1)

  })

  it('shows a collapse toggle when onToggleCollapse is provided', async () => {
    const user = userEvent.setup()
    const onToggleCollapse = vi.fn()

    render(<AdminSidebar onToggleCollapse={onToggleCollapse} />)

    await user.click(screen.getByRole('button', { name: /collapse navigation/i }))
    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
  })

  it('rail density renders icon-only links with accessible names', () => {
    render(<AdminSidebar density="rail" onToggleCollapse={() => {}} />)

    expect(screen.getByRole('button', { name: /expand navigation/i })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByRole('link', { name: /Theme & Colors/i })).toBeInTheDocument()
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

