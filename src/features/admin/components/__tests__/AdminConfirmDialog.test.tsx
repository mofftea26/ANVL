import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AdminConfirmDialog } from '../AdminConfirmDialog'

describe('AdminConfirmDialog', () => {
  it('calls onConfirm when confirm is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <AdminConfirmDialog
        open
        onClose={onClose}
        title="Delete item?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
      >
        Remove this item from storage.
      </AdminConfirmDialog>,
    )

    expect(screen.getByRole('heading', { name: /delete item/i })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <AdminConfirmDialog
        open
        onClose={onClose}
        title="Archive?"
        confirmLabel="Archive"
        onConfirm={() => {}}
      >
        Body copy
      </AdminConfirmDialog>,
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
