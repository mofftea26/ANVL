import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AdminChoiceDialog } from '../AdminChoiceDialog'

function renderDialog(overrides: Partial<Parameters<typeof AdminChoiceDialog>[0]> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onPrimary: vi.fn(),
    onSecondary: vi.fn(),
  }
  render(
    <AdminChoiceDialog
      open
      title="Unsaved changes"
      primaryLabel="Save"
      secondaryLabel="Discard"
      cancelLabel="Continue editing"
      {...handlers}
      {...overrides}
    >
      You have unsaved edits.
    </AdminChoiceDialog>,
  )
  return handlers
}

describe('AdminChoiceDialog', () => {
  it('renders all three actions and routes each to its handler', async () => {
    const user = userEvent.setup()
    const handlers = renderDialog()

    expect(screen.getByRole('heading', { name: /unsaved changes/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(handlers.onPrimary).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /^discard$/i }))
    expect(handlers.onSecondary).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /continue editing/i }))
    expect(handlers.onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape (cancel path)', async () => {
    const user = userEvent.setup()
    const handlers = renderDialog()
    await user.keyboard('{Escape}')
    expect(handlers.onClose).toHaveBeenCalledTimes(1)
    expect(handlers.onPrimary).not.toHaveBeenCalled()
    expect(handlers.onSecondary).not.toHaveBeenCalled()
  })

  it('disables cancel/secondary while the primary action is loading', () => {
    renderDialog({ primaryLoading: true })
    expect(screen.getByRole('button', { name: /continue editing/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^discard$/i })).toBeDisabled()
  })
})
