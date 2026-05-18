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
  useAdminAuth: () => ({ logout: vi.fn() }),
}))

describe('AdminLayout', () => {
  it('renders children in main and opens the mobile nav drawer', async () => {
    const user = userEvent.setup()
    render(
      <AdminLayout title="Drops" description="Manage campaigns">
        <p>Editor body</p>
      </AdminLayout>,
    )

    expect(screen.getByRole('heading', { name: 'Drops' })).toBeInTheDocument()
    expect(screen.getByText('Editor body')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open admin navigation/i }))
    expect(screen.getByRole('dialog', { name: 'Admin navigation' })).toBeInTheDocument()
  })
})
