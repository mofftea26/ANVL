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



  it('renders modern nav sections with descriptions and no badge pills', async () => {

    const user = userEvent.setup()

    render(<AdminSidebar />)



    expect(screen.getByText('ANVL Admin')).toBeInTheDocument()

    expect(screen.getByText('Content studio')).toBeInTheDocument()

    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument()



    const dashboard = screen.getByRole('link', { name: /Dashboard/i })

    expect(dashboard).toHaveAttribute('aria-current', 'page')

    expect(dashboard.className).toContain('rounded-xl')

    expect(dashboard.className).not.toContain('rounded-full')

    expect(screen.getByText('Shortcuts to every CMS surface.')).toBeInTheDocument()



    for (const cluster of ['Overview', 'Campaigns', 'Catalog', 'Site & discovery']) {

      expect(screen.getByText(cluster)).toBeInTheDocument()

    }



    for (const badge of ['Global', 'Discovery', 'Assets']) {
      expect(screen.queryByText(badge)).not.toBeInTheDocument()
    }

    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()



    expect(screen.getByText('editor@anvl.test')).toBeInTheDocument()



    const storefrontLink = screen.getByRole('link', { name: /storefront/i })

    expect(storefrontLink).toHaveAttribute('href', '/')

    expect(storefrontLink).toHaveAttribute('target', '_blank')



    const logoutButton = screen.getByRole('button', { name: /sign out/i })

    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)

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

