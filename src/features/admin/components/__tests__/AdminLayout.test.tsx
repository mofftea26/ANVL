import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AdminLayout } from '@/features/admin/components/AdminLayout'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children?: ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useRouterState: (opts?: {
    select?: (s: { location: { pathname: string } }) => unknown
  }) => {
    const state = { location: { pathname: '/admin/drops' } }
    return opts?.select ? opts.select(state) : state
  },
}))

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    logout: vi.fn(),
    isRemoteCmsReady: true,
    remoteHydrateError: null,
  }),
}))

describe('AdminLayout', () => {
  it('renders children in full-width main without a persistent sidebar', () => {
    render(
      <AdminLayout title="Drops" description="Manage campaigns">
        <p>Editor body</p>
      </AdminLayout>,
    )

    expect(screen.getByRole('heading', { name: 'Drops' })).toBeInTheDocument()
    expect(screen.getByText('Editor body')).toBeInTheDocument()
    expect(screen.queryByText('ANVL Admin')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open admin navigation/i })).toBeInTheDocument()
  })

  it('opens the nav drawer from the topbar burger at every breakpoint', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout title="Drops" description="Manage campaigns">
        <p>Editor body</p>
      </AdminLayout>,
    )

    const menuButton = screen.getByRole('button', { name: /open admin navigation/i })
    expect(menuButton.className).not.toContain('lg:hidden')

    await user.click(menuButton)
    expect(screen.getByRole('dialog', { name: 'Admin navigation' })).toBeInTheDocument()
    expect(screen.getByText('ANVL Admin')).toBeInTheDocument()
  })

  it('closes the nav drawer when a sidebar link is activated', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout title="Drops">
        <p>Editor body</p>
      </AdminLayout>,
    )

    await user.click(screen.getByRole('button', { name: /open admin navigation/i }))
    await user.click(screen.getByRole('link', { name: 'Dashboard' }))

    expect(screen.queryByRole('dialog', { name: 'Admin navigation' })).not.toBeInTheDocument()
  })
})
