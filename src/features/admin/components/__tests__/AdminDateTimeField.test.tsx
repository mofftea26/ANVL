import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AdminDateTimeField } from '@/features/admin/components/AdminDateTimeField'

describe('AdminDateTimeField', () => {
  it(
    'opens forge popover, renders calendar grid, and persists ISO after hour change',
    async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <div>
        <span id="ld-field">When</span>
        <AdminDateTimeField
          aria-labelledby="ld-field"
          value="2027-01-07T12:00:00.000Z"
          onChange={onChange}
        />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /when/i }))
    expect(screen.getByRole('grid')).toBeTruthy()

    const hourCombo = screen.getByRole('combobox', { name: /^hour$/i })
    await user.click(hourCombo)
    /** Minute select also renders `23` as MM; pick an hour label that is unique among open options. */
    await user.click(await screen.findByRole('option', { name: '17' }))

    expect(onChange).toHaveBeenCalled()
    const nextIso = onChange.mock.calls.at(-1)?.[0] as string | undefined
    expect(nextIso && !Number.isNaN(new Date(nextIso).getTime())).toBe(true)
    },
    20_000,
  )
})
