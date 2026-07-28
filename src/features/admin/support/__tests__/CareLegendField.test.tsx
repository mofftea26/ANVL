import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CareLegendField } from '../CareLegendField'
import { DEFAULT_SUPPORT_CONTENT, type SupportContentConfig } from '@/features/cms/support/supportContent.zod'

function Harness({ onChange }: { onChange?: (next: SupportContentConfig['careGuide']['legend']) => void }) {
  const [config, setConfig] = useState<SupportContentConfig>(() =>
    structuredClone(DEFAULT_SUPPORT_CONTENT),
  )
  return (
    <CareLegendField
      config={config}
      onChange={(legend) => {
        setConfig((prev) => ({ ...prev, careGuide: { ...prev.careGuide, legend } }))
        onChange?.(legend)
      }}
    />
  )
}

describe('CareLegendField', () => {
  it('shows the tally and all 26 default symbols, grouped by category', () => {
    render(<Harness />)
    expect(screen.getByText('26 of 26 marks')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox', { name: /symbol label$/i })).toHaveLength(26)
    // Default copy shows as the placeholder, not a stored value.
    expect(screen.getByRole('textbox', { name: /^wash symbol label/i })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /^wash symbol label/i })).toHaveAttribute(
      'placeholder',
      'Machine wash',
    )
  })

  it('a category chip filters to that category only and updates the tally', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /^bleaching/i }))
    expect(screen.getByText('2 of 26 marks')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox', { name: /symbol label$/i })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /^bleaching/i }))
    expect(screen.getByText('26 of 26 marks')).toBeInTheDocument()
  })

  it('searching narrows the grid after the debounce', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('searchbox', { name: /search care symbols/i }), 'bleach')
    await screen.findByText('2 of 26 marks', {}, { timeout: 1000 })
    expect(screen.getAllByRole('textbox', { name: /symbol label$/i })).toHaveLength(2)
  })

  it('editing one symbol writes only that override — the rest stay absent, not copied defaults', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: /^wash symbol label/i }), 'Wash it')

    const last = onChange.mock.calls.at(-1)?.[0] as SupportContentConfig['careGuide']['legend']
    expect(last.entries.wash?.label).toBe('Wash it')
    // Untouched symbols are not present in the persisted map at all.
    expect('wash-30' in last.entries).toBe(false)
    expect(Object.keys(last.entries)).toEqual(['wash'])
  })

  it('"Reset to default" deletes the entry key entirely rather than writing the default text back', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    expect(screen.getByRole('button', { name: /reset wash to default/i })).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: /^wash symbol label/i }), 'X')
    expect(screen.getByRole('button', { name: /reset wash to default/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /reset wash to default/i }))
    const last = onChange.mock.calls.at(-1)?.[0] as SupportContentConfig['careGuide']['legend']
    expect('wash' in last.entries).toBe(false)
    expect(screen.getByRole('textbox', { name: /^wash symbol label/i })).toHaveValue('')
  })

  it('shows an explicit empty state when nothing matches, and "Clear filters" restores everything', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(
      screen.getByRole('searchbox', { name: /search care symbols/i }),
      'zzz-no-match',
    )
    expect(await screen.findByText('No marks match')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(await screen.findByText('26 of 26 marks')).toBeInTheDocument()
  })
})
