/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { Save } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { AdminTopbarChipButton } from '../AdminTopbarChipButton'

describe('AdminTopbarChipButton', () => {
  it('renders label and uses pill chip classes', () => {
    render(
      <AdminTopbarChipButton aria-label="Save drop" icon={<Save size={14} />}>
        Save
      </AdminTopbarChipButton>,
    )

    const btn = screen.getByRole('button', { name: 'Save drop' })
    expect(btn.textContent).toContain('Save')
    expect(btn.className.includes('rounded-full')).toBe(true)
    expect(btn.className.includes('h-9')).toBe(true)
  })

  it('applies primary variant accent border', () => {
    render(
      <AdminTopbarChipButton variant="primary" aria-label="Save">
        Save
      </AdminTopbarChipButton>,
    )
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn.className.includes('color-accent')).toBe(true)
  })

  it('applies destructive variant red tint', () => {
    render(
      <AdminTopbarChipButton variant="destructive" aria-label="Delete">
        Delete
      </AdminTopbarChipButton>,
    )
    const btn = screen.getByRole('button', { name: 'Delete' })
    expect(btn.className.includes('red-500')).toBe(true)
  })

  it('icon size uses square w-9 chip', () => {
    render(
      <AdminTopbarChipButton size="icon" variant="ghost" aria-label="Menu">
        <span aria-hidden>⋯</span>
      </AdminTopbarChipButton>,
    )
    const btn = screen.getByRole('button', { name: 'Menu' })
    expect(btn.className.includes('w-9')).toBe(true)
  })
})
