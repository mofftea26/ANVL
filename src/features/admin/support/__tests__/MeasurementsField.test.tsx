import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MeasurementsField } from '../MeasurementsField'
import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import type { SizeMeasure } from '@/features/cms/support/supportContent.zod'

const BLANK_MEASURE: SizeMeasure = { heading: '', intro: '', footnote: '', garmentTypes: [] }
const D = SUPPORT_CONTENT_DEFAULTS.sizeGuide.measure

function Harness({ onChange }: { onChange?: (next: SizeMeasure) => void }) {
  const [measure, setMeasure] = useState<SizeMeasure>(structuredClone(BLANK_MEASURE))
  return (
    <MeasurementsField
      measure={measure}
      onChange={(next) => {
        setMeasure(next)
        onChange?.(next)
      }}
    />
  )
}

describe('MeasurementsField', () => {
  it('shows the designed defaults as placeholders and the tee garment type by default', () => {
    render(<Harness />)
    expect(screen.getByPlaceholderText(D.heading)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(D.footnote)).toBeInTheDocument()
    // Tee carries all 7 points.
    expect(screen.getAllByRole('textbox', { name: /point letter$/i })).toHaveLength(7)
    expect(screen.getByRole('textbox', { name: /^chest point label/i })).toBeInTheDocument()
  })

  it('editing one point patches only that point, leaving the rest blank (default)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: /^chest point label/i }), 'Torso width')

    const last = onChange.mock.calls.at(-1)?.[0] as SizeMeasure
    const tee = last.garmentTypes.find((g) => g.key === 'tee')
    expect(tee?.points.find((p) => p.key === 'chest')?.label).toBe('Torso width')
    // Untouched points keep the CMS-side value blank — the resolver supplies the default.
    expect(tee?.points.find((p) => p.key === 'waist')?.label).toBe('')
    // All 7 canonical points are present, none added/removed.
    expect(tee?.points.map((p) => p.key).sort()).toEqual(
      ['bottom', 'chest', 'collar', 'cuff', 'length', 'sleeve', 'waist'].sort(),
    )
  })

  it('switching the garment type shows that type’s fixed point set', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('combobox', { name: /garment type/i }))
    await user.click(screen.getByRole('option', { name: /joggers/i }))

    // Joggers carry 4 points, no chest/collar/sleeve.
    expect(screen.getAllByRole('textbox', { name: /point letter$/i })).toHaveLength(4)
    expect(screen.queryByRole('textbox', { name: /^chest point label/i })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^bottom point label/i })).toBeInTheDocument()
  })

  it('moves a point with the down arrow, reordering the stored array', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /move point 1 down/i }))

    const last = onChange.mock.calls.at(-1)?.[0] as SizeMeasure
    const tee = last.garmentTypes.find((g) => g.key === 'tee')
    expect(tee?.points.map((p) => p.key).slice(0, 2)).toEqual(['chest', 'length'])
  })

  it('drag handle shows the authored letter, not the code-default one, once a point is renamed', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    // Chest is tee's 2nd point (length, chest, waist, ...) — default letter "B".
    const chestLetterInput = screen.getByRole('textbox', { name: /^chest point letter/i })
    await user.clear(chestLetterInput)
    await user.type(chestLetterInput, 'X')

    const handle = screen.getByRole('button', { name: /drag to reorder point 2/i })
    expect(handle).toHaveTextContent('Point X')
    expect(handle).not.toHaveTextContent('Point B')
  })

  it('"Reset to defaults" is disabled until the type is touched, then clears the whole override block', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: /^chest point label/i }), 'X')
    expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }))
    const last = onChange.mock.calls.at(-1)?.[0] as SizeMeasure
    expect(last.garmentTypes.some((g) => g.key === 'tee')).toBe(false)
    expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeDisabled()
  })
})
