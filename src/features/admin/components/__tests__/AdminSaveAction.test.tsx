/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AdminSaveAction } from '../AdminSaveAction'

describe('AdminSaveAction', () => {
  it('renders an icon-only button named + tooltipped by its label', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<AdminSaveAction onSave={onSave} saving={false} label="Save banner" />)

    const button = screen.getByRole('button', { name: 'Save banner' })
    expect(button.getAttribute('title')).toBe('Save banner')

    await user.click(button)
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('disables and marks busy while saving', () => {
    render(<AdminSaveAction onSave={() => {}} saving label="Save" />)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeDisabled()
    expect(button.getAttribute('aria-busy')).toBe('true')
  })

  it('shows the unsaved dot only while dirty and not saving', () => {
    const { rerender } = render(
      <AdminSaveAction onSave={() => {}} saving={false} dirty label="Save" />,
    )
    expect(screen.getByTestId('admin-save-dirty-dot')).toBeInTheDocument()

    rerender(<AdminSaveAction onSave={() => {}} saving dirty label="Save" />)
    expect(screen.queryByTestId('admin-save-dirty-dot')).toBeNull()

    rerender(<AdminSaveAction onSave={() => {}} saving={false} label="Save" />)
    expect(screen.queryByTestId('admin-save-dirty-dot')).toBeNull()
  })
})
