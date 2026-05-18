/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  readDropsArray,
  resetAllLocalCmsKeys,
} from '@/features/admin/drops/drops.service'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/admin/auth/ProtectedAdminRoute', () => ({
  ProtectedAdminRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

import { AdminNewDropPageRoute } from '../-newDrop'

describe('AdminNewDropPageRoute', () => {
  beforeEach(() => {
    resetAllLocalCmsKeys()
    navigateMock.mockClear()
  })

  it('shows a spinner then replace-navigates to the persisted draft id', async () => {
    render(<AdminNewDropPageRoute />)

    expect(
      screen.getByRole('status', { name: /creating your drop/i }),
    ).toBeInTheDocument()

    await waitFor(() => expect(navigateMock).toHaveBeenCalledTimes(1))

    const arg = navigateMock.mock.calls[0]?.[0] as {
      to: string
      params: { dropId: string }
      replace: boolean
    }
    expect(arg).toMatchObject({
      to: '/admin/drops/$dropId',
      replace: true,
    })
    expect(arg.params.dropId).toMatch(/^drop-/)
    expect(readDropsArray().some((d) => d.id === arg.params.dropId)).toBe(
      true,
    )
  })
})
