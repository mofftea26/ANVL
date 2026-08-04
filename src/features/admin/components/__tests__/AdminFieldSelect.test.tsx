import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AdminFieldSelect } from '../AdminFieldSelect'

/**
 * Radix reserves `''` for "cleared, show the placeholder" and THROWS on a
 * `<Select.Item value="">`, taking the whole admin panel down with it.
 *
 * A select often needs a real, selectable none — "All products", "Unassigned",
 * "Assign later" — which a placeholder cannot express because the user has to
 * be able to choose it back. `AdminFieldSelect` therefore swaps an empty option
 * for a sentinel internally.
 *
 * This crashed `/admin/techpacks` on load.
 */
const OPTIONS = [
  { value: '', label: 'Unassigned' },
  { value: 'oversized-tee', label: 'Oversized Tee' },
  { value: 'compression-tee', label: 'Compression Tee' },
]

describe('AdminFieldSelect — an option whose value is empty', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(
        <AdminFieldSelect label="Product" value="" options={OPTIONS} onChange={vi.fn()} />,
      ),
    ).not.toThrow()
  })

  it('shows the empty option label rather than the placeholder', () => {
    render(
      <AdminFieldSelect
        label="Product"
        value=""
        options={OPTIONS}
        onChange={vi.fn()}
        placeholder="Select…"
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Product' })).toHaveTextContent('Unassigned')
  })

  it('lists the empty option when opened', async () => {
    const user = userEvent.setup()
    render(<AdminFieldSelect label="Product" value="" options={OPTIONS} onChange={vi.fn()} />)

    await user.click(screen.getByRole('combobox', { name: 'Product' }))
    expect(await screen.findByRole('option', { name: /Unassigned/ })).toBeInTheDocument()
  })

  it('reports an empty string back to the caller, not the sentinel', async () => {
    // The sentinel is an internal detail; a caller storing it would write
    // "__anvl_select_none__" into a product slug.
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <AdminFieldSelect
        label="Product"
        value="oversized-tee"
        options={OPTIONS}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Product' }))
    await user.click(await screen.findByRole('option', { name: /Unassigned/ }))

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('still passes a real value through unchanged', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AdminFieldSelect label="Product" value="" options={OPTIONS} onChange={onChange} />)

    await user.click(screen.getByRole('combobox', { name: 'Product' }))
    await user.click(await screen.findByRole('option', { name: /Oversized Tee/ }))

    expect(onChange).toHaveBeenCalledWith('oversized-tee')
  })
})

describe('AdminFieldSelect — the ordinary case is untouched', () => {
  const PLAIN = [
    { value: 'tee', label: 'Tee' },
    { value: 'hoodie', label: 'Hoodie' },
  ]

  it('shows the placeholder when nothing is selected', () => {
    // Without an empty option present, `value=''` keeps meaning "cleared" —
    // exactly as every existing caller relies on.
    render(
      <AdminFieldSelect
        label="Garment"
        value=""
        options={PLAIN}
        onChange={vi.fn()}
        placeholder="Pick one…"
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Garment' })).toHaveTextContent('Pick one…')
  })

  it('passes the selected value straight through', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AdminFieldSelect label="Garment" value="" options={PLAIN} onChange={onChange} />)

    await user.click(screen.getByRole('combobox', { name: 'Garment' }))
    await user.click(await screen.findByRole('option', { name: /Hoodie/ }))

    expect(onChange).toHaveBeenCalledWith('hoodie')
  })
})
