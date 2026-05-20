/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminTopbar } from '../AdminTopbar'

const logout = vi.fn()

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    session: {
      kind: 'supabase' as const,
      email: 'george@gmail.com',
      userId: 'u1',
      displayName: 'George M',
      loggedInAt: '2026-01-01T00:00:00.000Z',
    },
    logout,
  }),
}))

vi.mock('@/features/admin/components/AdminPageActionsContext', () => ({
  useAdminPageActionsSlot: () => null,
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

describe('AdminTopbar', () => {
  it('shows session chip with email tooltip, not inline display name row', () => {
    render(<AdminTopbar title="Dashboard" onOpenMenu={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.queryByText('George M')).toBeNull()
    expect(screen.getByLabelText(/Account menu for george@gmail.com/i)).toBeTruthy()
  })

  it('opens account menu with settings link', async () => {
    const user = userEvent.setup()
    render(<AdminTopbar title="Drops" onOpenMenu={() => {}} />)
    await user.click(screen.getByLabelText(/Account menu/i))
    expect(screen.getByRole('link', { name: 'Settings' })).toBeTruthy()
  })
})
