import type { ReactNode } from 'react'

import { render, screen } from '@testing-library/react'

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

  useAdminAuth: () => ({ logout: mockLogout }),

}))



describe('AdminSidebar', () => {

  beforeEach(() => {

    mockLogout.mockClear()

  })



  it('renders cluster labels and chip nav links without badge pills', async () => {

    const user = userEvent.setup()

    render(<AdminSidebar />)



    expect(screen.getByText('ANVL Admin')).toBeInTheDocument()

    expect(screen.getByRole('navigation')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(

      'aria-current',

      'page',

    )



    for (const cluster of ['Workspace', 'Campaigns', 'Catalog', 'Site']) {

      expect(screen.getByText(cluster)).toBeInTheDocument()

    }



    for (const badge of ['Overview', 'System', 'Global', 'Discovery', 'Assets']) {

      expect(screen.queryByText(badge)).not.toBeInTheDocument()

    }



    await user.click(screen.getByRole('button', { name: /logout/i }))

    expect(mockLogout).toHaveBeenCalledTimes(1)



    const storefrontLink = screen.getByRole('link', { name: /view storefront/i })

    expect(storefrontLink).toHaveAttribute('href', '/')

    expect(storefrontLink).toHaveAttribute('target', '_blank')

  })



  it('calls onNavigate when density is drawer and storefront link is activated', async () => {

    const user = userEvent.setup()

    const onNavigate = vi.fn()



    render(<AdminSidebar density="drawer" onNavigate={onNavigate} />)



    await user.click(screen.getByRole('link', { name: /view storefront/i }))

    expect(onNavigate).toHaveBeenCalledTimes(1)

  })

})


