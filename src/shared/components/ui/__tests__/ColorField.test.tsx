/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { ColorField } from '@/shared/components/ui/ColorField'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ColorField', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  it('merges fineInputControlClass onto the HEX text input (popover)', async () => {
    const user = userEvent.setup()
    render(
      <ColorField
        value="#ffffff"
        onChange={vi.fn()}
        fineInputControlClass="custom-admin-fine-input"
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /open color editor/i }),
    )
    const hex = screen.getByRole('textbox', { name: /hex/i })
    expect(hex.classList.contains('custom-admin-fine-input')).toBe(true)
  })

  it('inline variant exposes HEX input without opening a popover', () => {
    render(
      <ColorField inline value="#000000" onChange={vi.fn()} />,
    )
    expect(screen.getByRole('textbox', { name: /hex/i })).toBeTruthy()
  })

  it('copies palette hex to clipboard and toasts on copy click', async () => {
    render(<ColorField value="#aabbcc" onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /copy color #AABBCC/i }))
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('#AABBCC')
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard.')
    })
  })

  it('opens popover from swatch and closes with Escape', async () => {
    const user = userEvent.setup()
    render(<ColorField value="#112233" onChange={vi.fn()} label="Surface" />)

    await user.click(screen.getByRole('button', { name: /^surface$/i }))
    expect(screen.getByRole('textbox', { name: /hex/i })).toBeTruthy()
    expect(screen.getByTestId('anvl-color-visual-picker')).toBeTruthy()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox', { name: /hex/i })).toBeNull()
  })

  it('compact density uses fixed height input row chip (not stretchable swatch)', () => {
    const { container } = render(
      <ColorField
        density="compact"
        value="#aabbcc"
        onChange={vi.fn()}
        label="Accent"
      />,
    )
    const tile = container.querySelector('[data-anvl-color-field-density="compact"]')
    expect(tile).toBeTruthy()
    expect(tile?.classList.contains('h-10')).toBe(true)
    expect(tile?.classList.contains('min-h-[7rem]')).toBe(false)
    expect(tile?.parentElement?.classList.contains('max-h-10')).toBe(true)
    const opener = screen.getByRole('button', { name: /^accent$/i })
    expect(opener.classList.contains('rounded-full')).toBe(true)
  })
})
