/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AdminSettingsPageRoute } from '../-adminSettings'

vi.mock('@/features/admin/components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

const resetKeys = vi.hoisted(() => vi.fn())

vi.mock('@/features/admin/lib/resetLocalCms', () => ({
  resetAllLocalCmsKeys: () => resetKeys(),
}))

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    session: {
      userId: 'user-1',
      email: 'admin@anvl.test',
      displayName: 'Admin',
      verifiedAt: '2026-01-01T00:00:00.000Z',
    },
    isAuthenticated: true,
    isBootstrapping: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('AdminSettingsPageRoute', () => {
  beforeEach(() => {
    resetKeys.mockClear()
  })

  it('keeps Reset everything disabled until both fields match', () => {
    render(<AdminSettingsPageRoute />)

    fireEvent.click(
      screen.getByRole('button', { name: /reset all local cms data/i }),
    )

    const dialog = screen.getByRole('dialog')
    const confirmation = within(dialog).getByLabelText(/^confirmation$/i)
    const confirm = within(dialog).getByLabelText(/^confirm$/i)
    const submit = within(dialog).getByRole('button', { name: /^reset everything$/i })

    expect(submit.hasAttribute('disabled')).toBe(true)

    fireEvent.change(confirmation, { target: { value: 'a' } })
    fireEvent.change(confirm, { target: { value: 'b' } })
    expect(submit.hasAttribute('disabled')).toBe(true)
    expect(within(dialog).getByText(/passwords must match/i)).toBeTruthy()

    fireEvent.change(confirm, { target: { value: 'a' } })
    expect(submit.hasAttribute('disabled')).toBe(false)
  })

  it('calls reset when both fields match', () => {
    render(<AdminSettingsPageRoute />)

    fireEvent.click(
      screen.getByRole('button', { name: /reset all local cms data/i }),
    )
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/^confirmation$/i), {
      target: { value: 'confirm-me' },
    })
    fireEvent.change(within(dialog).getByLabelText(/^confirm$/i), {
      target: { value: 'confirm-me' },
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: /^reset everything$/i }),
    )

    expect(resetKeys).toHaveBeenCalledTimes(1)
  })

  it('shows mismatch error when confirm differs', () => {
    render(<AdminSettingsPageRoute />)

    fireEvent.click(
      screen.getByRole('button', { name: /reset all local cms data/i }),
    )
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/^confirmation$/i), {
      target: { value: 'a' },
    })
    fireEvent.change(within(dialog).getByLabelText(/^confirm$/i), {
      target: { value: 'b' },
    })

    expect(within(dialog).getByText(/passwords must match/i)).toBeTruthy()
    expect(
      within(dialog).getByRole('button', { name: /^reset everything$/i }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
