import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CareSelector } from '../CareSelector'
import type { CareItem } from '@/features/cms/support/supportContent.zod'

function Harness({
  initial = [],
  onChange,
}: {
  initial?: CareItem[]
  onChange?: (next: CareItem[]) => void
}) {
  const [items, setItems] = useState<CareItem[]>(initial)
  return (
    <CareSelector
      items={items}
      onChange={(next) => {
        setItems(next)
        onChange?.(next)
      }}
    />
  )
}

const machineWash = (value = '30', id = `i-mw-${value}`): CareItem => ({
  id,
  icon: 'washing-machine',
  name: 'Machine wash',
  value,
  note: '',
})

describe('CareSelector', () => {
  it('adds a blank custom row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /add instruction/i }))
    const next = onChange.mock.calls.at(-1)?.[0] as CareItem[]
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ icon: 'generic', name: '', value: '', note: '' })
    // A row without a preset match shows the custom text input.
    expect(screen.getByRole('textbox', { name: /custom text/i })).toBeInTheDocument()
  })

  it('applies a preset (icon + name + default value) and shows the value input only when needed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial={[{ id: 'i1', icon: 'generic', name: '', value: '', note: '' }]} onChange={onChange} />)

    await user.click(screen.getByRole('combobox', { name: /instruction 1 preset/i }))
    await user.click(screen.getByRole('option', { name: 'Machine wash' }))

    let items = onChange.mock.calls.at(-1)?.[0] as CareItem[]
    expect(items[0]).toMatchObject({ icon: 'wash', name: 'Machine wash', value: '30' })
    // Temperature input visible with the °C label.
    expect(
      screen.getByRole('textbox', { name: /temperature in degrees celsius/i }),
    ).toHaveValue('30')

    // Switch to a preset without a value — the value input disappears and value clears.
    await user.click(screen.getByRole('combobox', { name: /instruction 1 preset/i }))
    await user.click(screen.getByRole('option', { name: 'Line dry' }))
    items = onChange.mock.calls.at(-1)?.[0] as CareItem[]
    expect(items[0]).toMatchObject({ icon: 'line-dry', name: 'Line dry', value: '' })
    expect(
      screen.queryByRole('textbox', { name: /temperature in degrees celsius/i }),
    ).not.toBeInTheDocument()
  })

  it('blocks a duplicate preset with the same value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Harness
        initial={[machineWash('30'), { id: 'i2', icon: 'generic', name: '', value: '', note: '' }]}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: /instruction 2 preset/i }))
    await user.click(screen.getByRole('option', { name: 'Machine wash' }))

    // Blocked: no state change, inline alert explains why.
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/already in the list/i)
  })

  it('allows the same preset again when the value differs', () => {
    const onChange = vi.fn()
    render(
      <Harness
        initial={[machineWash('30'), machineWash('40')]}
        onChange={onChange}
      />,
    )
    // Both rows render as Machine wash with distinct temperatures.
    const temps = screen.getAllByRole('textbox', { name: /temperature in degrees celsius/i })
    expect(temps).toHaveLength(2)
    expect(temps[0]).toHaveValue('30')
    expect(temps[1]).toHaveValue('40')
  })

  it('removes a row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial={[machineWash()]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /remove instruction 1/i }))
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual([])
  })

  it('shows a legible symbol preview with the instruction name and its meaning', () => {
    render(
      <Harness
        initial={[{ id: 'i1', icon: 'wash-30', name: 'Machine wash 30°C', value: '', note: '' }]}
      />,
    )
    // The instruction name shows in the prominent preview (and the select label)…
    expect(screen.getAllByText('Machine wash 30°C').length).toBeGreaterThan(0)
    // …with its plain-language meaning caption…
    expect(screen.getByText(/wash at 30°C/i)).toBeInTheDocument()
    // …and an actual rendered SVG symbol.
    expect(document.querySelector('svg')).not.toBeNull()
  })
})
