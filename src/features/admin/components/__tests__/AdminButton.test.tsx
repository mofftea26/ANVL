import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AdminButton } from '../AdminButton'

describe('AdminButton', () => {
  it('renders primary label as pill chip with focus-ring', () => {
    const { container } = render(<AdminButton>Save</AdminButton>)
    const el = container.querySelector('button')
    expect(el?.textContent).toBe('Save')
    expect(el?.className.includes('focus-ring')).toBe(true)
    expect(el?.className.includes('rounded-full')).toBe(true)
    expect(el?.className.includes('h-9')).toBe(true)
  })

  it('honors destructive variant as red-tinted chip', () => {
    const { container } = render(<AdminButton variant="destructive">Remove</AdminButton>)
    const el = container.querySelector('button')
    expect(el?.className.includes('red-500')).toBe(true)
    expect(el?.className.includes('rounded-full')).toBe(true)
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

  it('drives admin tab variants via data-active on shared Button', () => {
    const { container } = render(
      <AdminButton variant="adminTabList" data-active="true">
        All
      </AdminButton>,
    )
    const el = container.querySelector('button')
    expect(el?.getAttribute('data-active')).toBe('true')
    expect(el?.className.includes('data-[active=true]')).toBe(true)
    expect(el?.className.includes('rounded-full')).toBe(true)
  })

  it('maps compact ghost to icon chip for overflow triggers', () => {
    const { container } = render(
      <AdminButton variant="ghost" size="compact" aria-label="Actions">
        ⋯
      </AdminButton>,
    )
    const el = container.querySelector('button')
    expect(el?.className.includes('w-9')).toBe(true)
  })
})
