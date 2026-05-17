/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/shared/components/ui/Modal'

describe('Modal (Phase H / RESP-01)', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}}>
        <p>body</p>
      </Modal>,
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('exposes role=dialog + aria-modal=true', () => {
    render(
      <Modal open onClose={() => {}} title="Hello">
        <p>body</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('renders title as an h2 wired to aria-labelledby', () => {
    render(
      <Modal open onClose={() => {}} title="Confirm thing">
        <p>body</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    const id = dialog.getAttribute('aria-labelledby')
    expect(id).toBeTruthy()
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Confirm thing',
    })
    expect(heading.id).toBe(id)
  })

  it('honors an explicit aria-labelledby and skips auto-heading rendering', () => {
    render(
      <>
        <h2 id="external-title">External</h2>
        <Modal open onClose={() => {}} aria-labelledby="external-title">
          <p>body</p>
        </Modal>
      </>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe('external-title')
    // Only one heading (the external one) since no `title` prop.
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
  })

  it('falls back to aria-label when no title / labelledby is provided', () => {
    render(
      <Modal open onClose={() => {}} aria-label="Anonymous dialog">
        <p>body</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe(
      'Anonymous dialog',
    )
  })

  it('forwards aria-describedby to the dialog surface', () => {
    render(
      <Modal open onClose={() => {}} title="T" aria-describedby="d1">
        <p id="d1">
          body
        </p>
      </Modal>,
    )
    expect(screen.getByRole('dialog').getAttribute('aria-describedby')).toBe(
      'd1',
    )
  })

  it('closes on Escape (focus trap delegates to useDialogFocusTrap)', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="X">
        <button>focusable</button>
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="X">
        <p>body</p>
      </Modal>,
    )
    fireEvent.click(screen.getByLabelText('Close modal backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
