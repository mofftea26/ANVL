import { render, screen, within } from '@testing-library/react'
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
  it('renders children in main with topbar navigation affordance', () => {
    render(
      <AdminLayout title="Drops" description="Manage campaigns">
        <p>Editor body</p>
      </AdminLayout>,
    )

    expect(screen.getByRole('heading', { name: 'Drops' })).toBeInTheDocument()
    expect(screen.getByText('Editor body')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open admin navigation/i })).toBeInTheDocument()
  })

  it('opens the nav drawer from the topbar burger', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout title="Drops" description="Manage campaigns">
        <p>Editor body</p>
      </AdminLayout>,
    )

    await user.click(screen.getByRole('button', { name: /open admin navigation/i }))
    const dialog = screen.getByRole('dialog', { name: 'Admin navigation' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('ANVL Admin')).toBeInTheDocument()
  })

  it('closes the nav drawer when a sidebar link is activated', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout title="Drops">
        <p>Editor body</p>
      </AdminLayout>,
    )

    await user.click(screen.getByRole('button', { name: /open admin navigation/i }))
    const dialog = screen.getByRole('dialog', { name: 'Admin navigation' })
    await user.click(within(dialog).getByRole('link', { name: /Dashboard/i }))

    expect(screen.queryByRole('dialog', { name: 'Admin navigation' })).not.toBeInTheDocument()
  })
})
