import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AdminPromptDialog } from '../AdminPromptDialog'

describe('AdminPromptDialog', () => {
  it('focuses the input, confirms with the typed value, and submits on Enter', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <AdminPromptDialog
        open
        onClose={() => {}}
        title="Name this preset"
        inputLabel="Preset name"
        onConfirm={onConfirm}
      />,
    )

    const input = screen.getByRole('textbox', { name: /preset name/i })
    await waitFor(() => expect(input).toHaveFocus())

    await user.type(input, '  Forge dark  ')
    await user.keyboard('{Enter}')
    expect(onConfirm).toHaveBeenCalledWith('Forge dark', undefined)
  })

  it('blocks confirm on empty value with an error (non-empty required by default)', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <AdminPromptDialog
        open
        onClose={() => {}}
        title="Name this preset"
        inputLabel="Preset name"
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i)
  })

  it('passes the extra select choice through onConfirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <AdminPromptDialog
        open
        onClose={() => {}}
        title="New theme"
        inputLabel="Theme name"
        extraLabel="Appearance"
        extraOptions={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
        ]}
        extraDefault="light"
        onConfirm={onConfirm}
      />,
    )

    await user.type(screen.getByRole('textbox', { name: /theme name/i }), 'Bone')
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    expect(onConfirm).toHaveBeenCalledWith('Bone', 'light')
  })

  it('cancel button and Escape both close without confirming', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <AdminPromptDialog
        open
        onClose={onClose}
        title="Prompt"
        inputLabel="Value"
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
