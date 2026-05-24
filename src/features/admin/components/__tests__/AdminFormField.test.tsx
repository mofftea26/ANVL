import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminFormField } from '../AdminFormField'

describe('AdminFormField', () => {
  it('associates label with control and shows error', () => {
    render(
      <AdminFormField label="Email" htmlFor="email" error="Required">
        <input id="email" />
      </AdminFormField>,
    )
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe('Required')
  })
})
