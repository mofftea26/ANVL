/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AdminSettingsPageRoute } from '../-adminSettings'

const mockVerify = vi.hoisted(() =>
  vi.fn((candidate: string) => candidate === 'correct-password'),
)

vi.mock('@/features/admin/auth/ProtectedAdminRoute', () => ({
  ProtectedAdminRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@/features/admin/components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock('@/features/admin/auth/adminAuth.storage', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/admin/auth/adminAuth.storage')>()
  return {
    ...actual,
    verifyAdminPassword: (c: string) => mockVerify(c),
    isAdminLoginConfigured: true,
  }
})

const resetKeys = vi.hoisted(() => vi.fn())

vi.mock('@/features/admin/lib/resetLocalCms', () => ({
  resetAllLocalCmsKeys: () => resetKeys(),
}))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => null,
}))

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    session: { username: 'admin', loggedInAt: '2026-01-01T00:00:00.000Z' },
    isAuthenticated: true,
    isHydrated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('AdminSettingsPageRoute', () => {
  beforeEach(() => {
    mockVerify.mockReset()
    mockVerify.mockImplementation((c: string) => c === 'correct-password')
    resetKeys.mockClear()
  })

  it('keeps Reset everything disabled when verifyAdminPassword rejects', () => {
    mockVerify.mockImplementation(() => false)
    render(<AdminSettingsPageRoute />)

    fireEvent.click(
      screen.getByRole('button', { name: /reset all local cms data/i }),
    )

    const dialog = screen.getByRole('dialog')
    const password = within(dialog).getByLabelText(/^admin password$/i)
    const confirm = within(dialog).getByLabelText(/^confirm admin password$/i)
    const submit = within(dialog).getByRole('button', { name: /^reset everything$/i })

    expect(submit.hasAttribute('disabled')).toBe(true)

    fireEvent.change(password, { target: { value: 'wrong' } })
    fireEvent.change(confirm, { target: { value: 'wrong' } })
    expect(submit.hasAttribute('disabled')).toBe(true)
    expect(
      within(dialog).getByText(/does not match the admin password/i),
    ).toBeTruthy()

    mockVerify.mockImplementation((c: string) => c === 'correct-password')
    fireEvent.change(password, { target: { value: 'correct-password' } })
    fireEvent.change(confirm, { target: { value: 'correct-password' } })
    expect(submit.hasAttribute('disabled')).toBe(false)
  })

  it('calls reset when password gate passes', () => {
    render(<AdminSettingsPageRoute />)

    fireEvent.click(
      screen.getByRole('button', { name: /reset all local cms data/i }),
    )
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/^admin password$/i), {
      target: { value: 'correct-password' },
    })
    fireEvent.change(within(dialog).getByLabelText(/^confirm admin password$/i), {
      target: { value: 'correct-password' },
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
    fireEvent.change(within(dialog).getByLabelText(/^admin password$/i), {
      target: { value: 'a' },
    })
    fireEvent.change(within(dialog).getByLabelText(/^confirm admin password$/i), {
      target: { value: 'b' },
    })

    expect(within(dialog).getByText(/passwords must match/i)).toBeTruthy()
    expect(
      within(dialog).getByRole('button', { name: /^reset everything$/i }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
