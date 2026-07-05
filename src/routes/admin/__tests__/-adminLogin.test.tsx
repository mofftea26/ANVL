/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminLoginPageRoute } from '../-adminLogin'

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabaseEnvIssue: () => null,
}))

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    login: vi.fn().mockResolvedValue({ ok: false, error: 'Incorrect email or password.' }),
    isAuthenticated: false,
    isBootstrapping: false,
    isRemoteCmsReady: true,
    remoteHydrateError: null,
  }),
}))

describe('AdminLoginPageRoute', () => {
  it('toggles password visibility with the eye control', () => {
    render(<AdminLoginPageRoute />)

    const password = screen.getByLabelText(/^password$/i)
    expect(password).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: /^show password$/i }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /^hide password$/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: /^hide password$/i }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('defaults Remember me to checked', () => {
    render(<AdminLoginPageRoute />)
    expect(screen.getByLabelText(/remember me for 30 days/i)).toBeChecked()
  })
})
