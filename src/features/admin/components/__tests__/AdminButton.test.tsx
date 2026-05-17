import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminButton } from '../AdminButton'

describe('AdminButton', () => {
  it('renders primary label and applies focus-ring', () => {
    const { container } = render(<AdminButton>Save</AdminButton>)
    const el = container.querySelector('button')
    expect(el?.textContent).toBe('Save')
    expect(el?.className.includes('focus-ring')).toBe(true)
  })

  it('honors destructive variant styling', () => {
    const { container } = render(<AdminButton variant="destructive">Remove</AdminButton>)
    const el = container.querySelector('button')
    expect(el?.className.includes('text-red-300')).toBe(true)
  })

  it('marks disabled controls', () => {
    render(
      <AdminButton variant="secondary" disabled>
        Off
      </AdminButton>,
    )
    const el = screen.getByRole('button', { name: /off/i })
    expect(el.hasAttribute('disabled')).toBe(true)
  })

  it('drives admin tab variants via data-active', () => {
    const { container } = render(
      <AdminButton variant="adminTabList" data-active="true">
        All
      </AdminButton>,
    )
    const el = container.querySelector('button')
    expect(el?.getAttribute('data-active')).toBe('true')
    expect(el?.className.includes('data-[active=true]')).toBe(true)
  })
})
