import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { PassportSheet } from '@/features/passport/components/PassportSheet'

const BODY_COPY = 'Forged in a single run of 100.'

function renderSheet(overrides: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = overrides.onClose ?? vi.fn()
  const utils = render(
    <PassportSheet
      open={overrides.open ?? true}
      onClose={onClose}
      eyebrow="Origin"
      title="The Collection"
    >
      <p>{BODY_COPY}</p>
    </PassportSheet>,
  )
  return { ...utils, onClose }
}

/** The scroll viewport is the element that directly wraps the section content. */
function sheetBody(): HTMLElement {
  const content = screen.getByText(BODY_COPY)
  const body = content.parentElement
  if (!body) throw new Error('sheet body not found')
  return body
}

describe('PassportSheet', () => {
  it('renders nothing while closed', () => {
    renderSheet({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders the eyebrow, title and content when open', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'The Collection' })).toBeTruthy()
    expect(screen.getByText('Origin')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'The Collection' })).toBeTruthy()
    expect(screen.getByText(BODY_COPY)).toBeTruthy()
  })

  // The bug this file exists for: when the header lived inside the scroller,
  // scrolled copy travelled through its box and was sliced by its bottom edge.
  it('keeps the header outside the scrolling body so content cannot pass through it', () => {
    renderSheet()
    const body = sheetBody()
    const heading = screen.getByRole('heading', { name: 'The Collection' })
    const close = screen.getByRole('button', { name: 'Close section' })

    expect(body.contains(heading)).toBe(false)
    expect(body.contains(close)).toBe(false)

    // Header and body are siblings inside the dialog panel, header first.
    const dialog = screen.getByRole('dialog')
    const header = body.previousElementSibling
    expect(header).not.toBeNull()
    expect(header!.contains(heading)).toBe(true)
    expect(header!.contains(close)).toBe(true)
    expect(body.parentElement).toBe(dialog)
  })

  // The fade ramp is exactly this long, so at rest it covers only empty
  // padding — no washed-out first line until content actually scrolls under
  // the header. Padding and ramp must move together.
  it('pads the top of the scrolling body by the length of the fade ramp', () => {
    renderSheet()
    expect(sheetBody().style.paddingTop).toBe('1.5rem')
  })

  it('closes on the close button, the backdrop and Escape', () => {
    const onClose = vi.fn()
    renderSheet({ onClose })

    fireEvent.click(screen.getByRole('button', { name: 'Close section' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  // The sheet opens mid-page, so it must lock scrolling without moving the
  // page (no body position:fixed), and must hand the page back untouched.
  it('locks and restores page scrolling without displacing the page', () => {
    const { unmount } = renderSheet()
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('')
    unmount()
    expect(document.documentElement.style.overflow).toBe('')
  })
})
