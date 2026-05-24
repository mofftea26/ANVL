/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
  it('shows inline spinner and disables when loading', () => {
    render(
      <Button loading data-testid="btn">
        Save
      </Button>,
    )
    const btn = screen.getByTestId('btn')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn.querySelector('svg')).toBeTruthy()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })
})
