/**
 * @vitest-environment jsdom
 */
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  CareStepsField,
  LabelValueRowsField,
  StringRowsField,
} from '../passportListFields'

function StringHarness() {
  const [values, setValues] = useState<string[]>(['First fact'])
  return (
    <>
      <StringRowsField values={values} onChange={setValues} label="Fact" addLabel="Add fact" />
      <output data-testid="state">{JSON.stringify(values)}</output>
    </>
  )
}

function CareHarness() {
  const [state, setState] = useState<{ steps: string[]; notes: string[] }>({
    steps: ['Rinse'],
    notes: ['Cold water'],
  })
  return (
    <>
      <CareStepsField steps={state.steps} notes={state.notes} onChange={setState} />
      <output data-testid="state">{JSON.stringify(state)}</output>
    </>
  )
}

function MeasurementHarness() {
  const [values, setValues] = useState<string[]>(['Chest|52 cm'])
  return (
    <>
      <LabelValueRowsField
        values={values}
        onChange={setValues}
        label="Measurement"
        labelPlaceholder="Label (e.g. Chest)"
        valuePlaceholder="Value (e.g. 52 cm)"
      />
      <output data-testid="state">{JSON.stringify(values)}</output>
    </>
  )
}

describe('passport list fields', () => {
  it('StringRowsField adds and edits rows', async () => {
    const user = userEvent.setup()
    render(<StringHarness />)

    await user.click(screen.getByRole('button', { name: 'Add fact' }))
    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual(['First fact', ''])

    await user.type(screen.getByRole('textbox', { name: 'Fact 2' }), 'Second')
    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual(['First fact', 'Second'])
  })

  it('CareStepsField keeps steps and notes index-aligned on add', async () => {
    const user = userEvent.setup()
    render(<CareHarness />)

    await user.click(screen.getByRole('button', { name: 'Add step' }))
    await user.type(screen.getByRole('textbox', { name: 'Step 2' }), 'Hang dry')
    await user.type(screen.getByRole('textbox', { name: 'Step 2 note' }), 'Away from heat')

    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual({
      steps: ['Rinse', 'Hang dry'],
      notes: ['Cold water', 'Away from heat'],
    })
  })

  it('LabelValueRowsField serializes label|value edits', async () => {
    const user = userEvent.setup()
    render(<MeasurementHarness />)

    await user.clear(screen.getByRole('textbox', { name: 'Measurement 1 Value (e.g. 52 cm)' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Measurement 1 Value (e.g. 52 cm)' }),
      '54 cm',
    )
    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual(['Chest|54 cm'])
  })
})
