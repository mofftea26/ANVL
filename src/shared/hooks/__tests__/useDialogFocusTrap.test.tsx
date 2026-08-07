import { describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'

function Dialog({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  children?: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  useDialogFocusTrap({ open, panelRef, onClose })
  if (!open) return null
  return (
    <div role="dialog" aria-label={label} ref={panelRef}>
      <button type="button">{label} action</button>
      {children}
    </div>
  )
}

describe('useDialogFocusTrap — Escape closes exactly one layer', () => {
  it('closes only the innermost dialog when two are stacked', async () => {
    const user = userEvent.setup()
    const closeOuter = vi.fn()
    const closeInner = vi.fn()

    render(
      <Dialog open onClose={closeOuter} label="Wizard">
        <Dialog open onClose={closeInner} label="Picker" />
      </Dialog>,
    )

    await user.keyboard('{Escape}')

    // The regression this guards: both handlers fired, so a picker opened from
    // inside a wizard took the wizard down with it.
    expect(closeInner).toHaveBeenCalledTimes(1)
    expect(closeOuter).not.toHaveBeenCalled()
  })

  it('closes the remaining dialog once the inner one has unmounted', async () => {
    const user = userEvent.setup()
    const closeOuter = vi.fn()

    const { rerender } = render(
      <Dialog open onClose={closeOuter} label="Wizard">
        <Dialog open onClose={() => {}} label="Picker" />
      </Dialog>,
    )
    // Inner closes; the stack must hand control back rather than stay stuck.
    rerender(
      <Dialog open onClose={closeOuter} label="Wizard">
        <Dialog open={false} onClose={() => {}} label="Picker" />
      </Dialog>,
    )

    await user.keyboard('{Escape}')
    expect(closeOuter).toHaveBeenCalledTimes(1)
  })

  it('a single dialog still closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Dialog open onClose={onClose} label="Solo" />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks background scroll while open and restores it on close', () => {
    const { rerender } = render(<Dialog open onClose={() => {}} label="Solo" />)
    expect(document.body.style.overflow).toBe('hidden')

    rerender(<Dialog open={false} onClose={() => {}} label="Solo" />)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('keeps the lock while an outer dialog is still open', () => {
    const { rerender } = render(
      <Dialog open onClose={() => {}} label="Wizard">
        <Dialog open onClose={() => {}} label="Picker" />
      </Dialog>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    // Only the inner one closes — the page must stay locked behind the wizard.
    rerender(
      <Dialog open onClose={() => {}} label="Wizard">
        <Dialog open={false} onClose={() => {}} label="Picker" />
      </Dialog>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Dialog open={false} onClose={() => {}} label="Wizard">
        <Dialog open={false} onClose={() => {}} label="Picker" />
      </Dialog>,
    )
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('moves focus into the panel on open', async () => {
    render(<Dialog open onClose={() => {}} label="Solo" />)
    // The trap focuses in a microtask so the panel is painted first.
    await Promise.resolve()
    expect(screen.getByRole('button', { name: 'Solo action' })).toHaveFocus()
  })
})
