import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SizeGuideTable, EMPTY_SIZE_TABLE } from '../SizeGuideTable'
import type { SizeTable } from '@/features/cms/support/supportContent.zod'

function Harness({ onChange }: { onChange?: (next: SizeTable) => void }) {
  const [table, setTable] = useState<SizeTable>(EMPTY_SIZE_TABLE)
  return (
    <SizeGuideTable
      value={table}
      onChange={(next) => {
        setTable(next)
        onChange?.(next)
      }}
    />
  )
}

describe('SizeGuideTable', () => {
  it('renders the fixed 7×6 grid with labelled cells', () => {
    render(<Harness />)
    expect(screen.getAllByRole('textbox')).toHaveLength(42)
    expect(screen.getByRole('textbox', { name: /chest width, size m/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /cuff width, size xxl/i })).toBeInTheDocument()
  })

  it('accepts decimal values and rejects non-numeric input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    const cell = screen.getByRole('textbox', { name: /chest width, size m/i })
    await user.type(cell, '48.5')
    expect(cell).toHaveValue('48.5')

    await user.type(cell, 'x')
    expect(cell).toHaveValue('48.5') // letter rejected

    const last = onChange.mock.calls.at(-1)?.[0] as SizeTable
    const chest = last.rows.find((r) => r.key === 'chest')
    expect(chest?.values).toEqual(['', '', '48.5', '', '', ''])
  })

  it('moves focus between cells with arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const lengthXs = screen.getByRole('textbox', { name: /^length, size xs/i })
    await user.click(lengthXs)
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('textbox', { name: /chest width, size xs/i })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('textbox', { name: /chest width, size s,/i })).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('textbox', { name: /^length, size s,/i })).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('textbox', { name: /^length, size xs/i })).toHaveFocus()
  })

  it('toggles the half-measurement flag', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('switch', { name: /half measurements/i }))
    expect((onChange.mock.calls.at(-1)?.[0] as SizeTable).halfMeasurement).toBe(false)
  })
})
