/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resetAllLocalCmsKeys } from '@/features/admin/drops/drops.service'

const navigateMock = vi.hoisted(() => vi.fn())
const createNewDropAsyncMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/admin/auth/ProtectedAdminRoute', () => ({
  ProtectedAdminRoute: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock('@/features/admin/drops/drops.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/admin/drops/drops.service')>()
  return {
    ...actual,
    createNewDropAsync: (...args: unknown[]) => createNewDropAsyncMock(...args),
  }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({
      children,
      ...props
    }: {
      children: React.ReactNode
      to: string
    }) => <a href={props.to}>{children}</a>,
  }
})

import { AdminNewDropPageRoute } from '../-newDrop'

describe('AdminNewDropPageRoute', () => {
  beforeEach(() => {
    resetAllLocalCmsKeys()
    navigateMock.mockClear()
    createNewDropAsyncMock.mockReset()
  })

  it('shows a spinner then replace-navigates to the persisted draft id', async () => {
    createNewDropAsyncMock.mockResolvedValue({
      ok: true,
      drop: { id: 'drop-new-test' },
    })

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
      params: { dropId: 'drop-new-test' },
    })
  })

  it('shows an alert when createNewDropAsync fails', async () => {
    createNewDropAsyncMock.mockResolvedValue({
      ok: false,
      error: 'duplicate slug',
    })

    render(<AdminNewDropPageRoute />)

    expect(await screen.findByRole('alert')).toHaveTextContent('duplicate slug')
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
