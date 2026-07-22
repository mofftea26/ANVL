import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminUnsavedChangesGuard } from '@/features/admin/components/AdminUnsavedChangesGuard'

const { blockerState, useBlockerMock } = vi.hoisted(() => {
  const blockerState = {
    status: 'idle' as 'idle' | 'blocked',
    proceed: vi.fn(),
    reset: vi.fn(),
  }
  return {
    blockerState,
    useBlockerMock: vi.fn((_options: unknown) => blockerState),
  }
})

vi.mock('@tanstack/react-router', () => ({
  useBlocker: useBlockerMock,
}))

const dirtyState = { dirty: true }

vi.mock('@/features/admin/hooks/useAdminDirtyRegistry', () => ({
  useIsAnyAdminEditorDirty: () => dirtyState.dirty,
}))

describe('AdminUnsavedChangesGuard', () => {
  beforeEach(() => {
    blockerState.status = 'idle'
    blockerState.proceed.mockClear()
    blockerState.reset.mockClear()
    useBlockerMock.mockClear()
    dirtyState.dirty = true
  })

  it('renders no dialog while navigation is not blocked', () => {
    render(<AdminUnsavedChangesGuard />)
    expect(screen.queryByRole('dialog')).toBeNull()
    // Native beforeunload stays wired for tab close while dirty.
    expect(useBlockerMock).toHaveBeenCalledWith(
      expect.objectContaining({ enableBeforeUnload: true, withResolver: true }),
    )
  })

  it('opens the app dialog when blocked — Leave proceeds, Stay resets', async () => {
    const user = userEvent.setup()
    blockerState.status = 'blocked'
    render(<AdminUnsavedChangesGuard />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(
      screen.getByText(/unsaved changes in this editor/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stay' }))
    expect(blockerState.reset).toHaveBeenCalledTimes(1)
    expect(blockerState.proceed).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Leave' }))
    expect(blockerState.proceed).toHaveBeenCalledTimes(1)
  })

  it('lets shouldBlockFn wave clean navigations through', () => {
    dirtyState.dirty = false
    render(<AdminUnsavedChangesGuard />)
    const options = useBlockerMock.mock.calls[0]?.[0] as {
      shouldBlockFn: () => boolean
      enableBeforeUnload: boolean
    }
    expect(options.shouldBlockFn()).toBe(false)
    expect(options.enableBeforeUnload).toBe(false)
  })
})
