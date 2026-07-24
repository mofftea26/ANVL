import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { StringListField } from '@/features/admin/components/StringListField'

/** Controlled harness so edits flow back like they do in the real editors. */
function Harness({ initial = [] as string[], maxItems }: { initial?: string[]; maxItems?: number }) {
  const [items, setItems] = useState(initial)
  return <StringListField items={items} onChange={setItems} itemLabel="line" maxItems={maxItems} />
}

describe('StringListField', () => {
  it('renders one input per item', () => {
    render(<Harness initial={['One', 'Two']} />)
    expect((screen.getByLabelText('line 1') as HTMLInputElement).value).toBe('One')
    expect((screen.getByLabelText('line 2') as HTMLInputElement).value).toBe('Two')
  })

  it('adds a blank row via the add button', () => {
    render(<Harness initial={['One']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    expect(screen.getByLabelText('line 2')).toBeInTheDocument()
  })

  it('edits an item in place', () => {
    render(<Harness initial={['One']} />)
    fireEvent.change(screen.getByLabelText('line 1'), { target: { value: 'Struck' } })
    expect((screen.getByLabelText('line 1') as HTMLInputElement).value).toBe('Struck')
  })

  it('removes an item', () => {
    render(<Harness initial={['One', 'Two']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove line 1' }))
    expect((screen.getByLabelText('line 1') as HTMLInputElement).value).toBe('Two')
    expect(screen.queryByLabelText('line 2')).toBeNull()
  })

  it('reorders with the keyboard down control', () => {
    render(<Harness initial={['One', 'Two']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Move line 1 down' }))
    expect((screen.getByLabelText('line 1') as HTMLInputElement).value).toBe('Two')
    expect((screen.getByLabelText('line 2') as HTMLInputElement).value).toBe('One')
  })

  it('disables up on the first row and down on the last row', () => {
    render(<Harness initial={['One', 'Two']} />)
    expect(screen.getByRole('button', { name: 'Move line 1 up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move line 2 down' })).toBeDisabled()
  })

  it('disables the add button at the max item count', () => {
    render(<Harness initial={['One', 'Two']} maxItems={2} />)
    expect(screen.getByRole('button', { name: 'Add item' })).toBeDisabled()
  })

  it('does not exceed maxItems when adding', () => {
    const onChange = vi.fn()
    render(<StringListField items={['a', 'b']} onChange={onChange} maxItems={2} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
