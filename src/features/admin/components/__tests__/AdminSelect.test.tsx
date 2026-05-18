import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'

describe('AdminSelect', () => {
  it('calls onValueChange when choosing an option', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <AdminSelect value="usd" onValueChange={onValueChange}>
        <AdminSelectTrigger aria-label="Currency">
          <AdminSelectValue placeholder="Pick" />
        </AdminSelectTrigger>
        <AdminSelectContent>
          <AdminSelectItem value="usd">USD</AdminSelectItem>
          <AdminSelectItem value="eur">EUR</AdminSelectItem>
        </AdminSelectContent>
      </AdminSelect>,
    )

    await user.click(screen.getByRole('combobox', { name: /currency/i }))
    await user.click(screen.getByRole('option', { name: 'EUR' }))

    expect(onValueChange).toHaveBeenCalledWith('eur')
  })
})
