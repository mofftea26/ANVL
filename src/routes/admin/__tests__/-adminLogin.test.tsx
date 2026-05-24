/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminLoginPageRoute } from '../-adminLogin'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/features/cms/api/supabasePublicEnv', () => ({
  getSupabasePublicEnv: () => null,
  isSupabaseAuthTarget: () => false,
  getSupabaseEnvIssue: () => null,
}))

vi.mock('@/features/admin/auth/useAdminAuth', () => ({
  useAdminAuth: () => ({
    login: vi.fn().mockResolvedValue({ ok: false, error: 'Incorrect username or password.' }),
    isAuthenticated: false,
    isHydrated: true,
    isRemoteCmsReady: true,
    remoteHydrateError: null,
    authMode: 'static' as const,
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
})
