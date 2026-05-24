/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminTopbar } from '../AdminTopbar'

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    session: {
      kind: 'supabase' as const,
      email: 'george@gmail.com',
      userId: 'u1',
      displayName: 'George M',
      loggedInAt: '2026-01-01T00:00:00.000Z',
    },
  }),
}))

vi.mock('@/features/admin/components/AdminPageActionsContext', () => ({
  useAdminPageActionsSlot: () => null,
}))

describe('AdminTopbar', () => {
  it('shows Supabase display name beside ANVL Admin', () => {
    render(
      <AdminTopbar title="Dashboard" onOpenMenu={() => {}} />,
    )
    expect(screen.getByText('George M')).toBeTruthy()
    expect(screen.getByTitle('george@gmail.com')).toBeTruthy()
  })
})
