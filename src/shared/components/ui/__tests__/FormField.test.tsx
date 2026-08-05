import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from '@/shared/components/ui/FormField'

/**
 * `FormField` renders an EXPLICIT `<label htmlFor>` rather than wrapping the
 * control (deliberate — a composite child would otherwise fold the label text
 * into a button's accessible name). The cost of that choice is that a missing
 * `htmlFor` yields a label pointing at nothing, i.e. a control that LOOKS
 * labelled but is anonymous to assistive tech. That was the cause of ~180
 * unlabelled admin inputs, so these tests pin the association itself.
 *
 * `getByLabelText` is the assertion that matters: it resolves through the
 * accessibility tree, so it only passes when the label is genuinely associated.
 */
describe('FormField — label association', () => {
  it('associates the label with a bare child that has no id', () => {
    render(
      <FormField label="Email">
        <input type="email" />
      </FormField>,
    )
    expect(screen.getByLabelText('Email')).toBe(
      screen.getByRole('textbox', { name: 'Email' }),
    )
  })

  it('respects an explicit htmlFor', () => {
    render(
      <FormField label="Slug" htmlFor="my-slug">
        <input id="my-slug" />
      </FormField>,
    )
    expect(screen.getByLabelText('Slug')).toHaveAttribute('id', 'my-slug')
  })

  it("preserves the child's own id rather than clobbering it", () => {
    // Other code may reference that id (aria-controls, scroll-to-field, tests).
    render(
      <FormField label="Title">
        <input id="keep-me" />
      </FormField>,
    )
    const input = screen.getByLabelText('Title')
    expect(input).toHaveAttribute('id', 'keep-me')
  })

  it('gives each field a distinct id so two fields never collide', () => {
    render(
      <>
        <FormField label="First">
          <input />
        </FormField>
        <FormField label="Second">
          <input />
        </FormField>
      </>,
    )
    const first = screen.getByLabelText('First')
    const second = screen.getByLabelText('Second')
    expect(first.id).not.toBe(second.id)
    expect(first).not.toBe(second)
  })

  it('works for selects and textareas, not just inputs', () => {
    render(
      <>
        <FormField label="Country">
          <select>
            <option>LB</option>
          </select>
        </FormField>
        <FormField label="Notes">
          <textarea />
        </FormField>
      </>,
    )
    expect(screen.getByLabelText('Country').tagName).toBe('SELECT')
    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA')
  })
})

describe('FormField — hint and error wiring', () => {
  it('announces the error and marks the control invalid', () => {
    render(
      <FormField label="Email" error="Enter a valid address">
        <input />
      </FormField>,
    )
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid address')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid address')
  })

  it('describes the control with its hint', () => {
    render(
      <FormField label="Handle" hint="Lowercase letters only">
        <input />
      </FormField>,
    )
    expect(screen.getByLabelText('Handle')).toHaveAccessibleDescription(
      'Lowercase letters only',
    )
  })

  it('is not marked invalid when there is no error', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>,
    )
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid')
  })
})
