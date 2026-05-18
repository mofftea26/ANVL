/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DebouncedColorField } from '@/features/admin/drops/DebouncedColorField'

vi.mock('@/shared/components/ui/ColorField', () => ({
  ColorField: ({
    onChange,
    label,
  }: {
    value?: string
    onChange: (v: string) => void
    label?: string
  }) => (
    <button type="button" aria-label={label ?? 'color-field'} onClick={() => onChange('#112233')}>
      bump
    </button>
  ),
}))

describe('DebouncedColorField', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces upstream commits while staying clickable', () => {
    const onChange = vi.fn()
    render(
      <DebouncedColorField label="Accent" value="#ffffff" onChange={onChange} debounceMs={80} />,
    )
    const btn = screen.getByRole('button', { name: /accent/i })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(80)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('#112233')
  })
})
