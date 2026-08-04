import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  PassportHotspotDetail,
  PassportHotspots,
} from '@/features/passport/components/PassportHotspots'

const hotspots = [
  { x: 30, y: 20, title: 'Shoulder knit', body: 'Ribbed for load.' },
  { x: 70, y: 55, title: 'Chest contour', body: 'Panelled to sit flat.' },
]

describe('PassportHotspots', () => {
  it('renders a marker per detail, positioned as a percentage of the render', () => {
    render(<PassportHotspots hotspots={hotspots} activeIndex={null} onSelect={() => {}} />)
    const marker = screen.getByRole('button', { name: 'Shoulder knit' })
    // Percent positioning is what keeps markers pinned at any display size.
    expect(marker.style.left).toBe('30%')
    expect(marker.style.top).toBe('20%')
    expect(screen.getByRole('button', { name: 'Chest contour' })).toBeTruthy()
  })

  /**
   * Size contract. The marks were reported as too big and were trimmed — the
   * PAINTED ring and dot only. The 44×44 hit area is a separate, invisible box
   * and is exactly what a "make them smaller" change is most likely to take
   * with it, so it is asserted alongside them rather than trusted.
   *
   * Class names stand in for sizes here because jsdom applies no stylesheet:
   * `h-11` is 44px, `h-3` is 12px, `h-2` is 8px on Tailwind's 0.25rem scale.
   */
  it('paints a small mark inside a full 44x44 touch target', () => {
    render(<PassportHotspots hotspots={hotspots} activeIndex={null} onSelect={() => {}} />)
    const marker = screen.getByRole('button', { name: 'Shoulder knit' })
    const has = (el: Element, token: string) => el.className.split(/\s+/).includes(token)

    // 44×44 — the touch target, which never shrinks with the artwork.
    expect(has(marker, 'h-11')).toBe(true)
    expect(has(marker, 'w-11')).toBe(true)

    const marks = Array.from(marker.querySelectorAll('span'))
    const ring = marks.find((el) => has(el, 'absolute'))
    const dot = marks.find((el) => has(el, 'relative'))
    if (!ring || !dot) throw new Error('marker is missing its ring or its dot')
    // 12px pulse ring around an 8px dot — the trimmed sizes.
    expect(has(ring, 'h-3') && has(ring, 'w-3')).toBe(true)
    expect(has(dot, 'h-2') && has(dot, 'w-2')).toBe(true)
    // …and neither may creep back up to the hit area's own size.
    expect(has(ring, 'h-11') || has(dot, 'h-11')).toBe(false)
  })

  it('renders nothing when a product has no authored details', () => {
    const { container } = render(
      <PassportHotspots hotspots={[]} activeIndex={null} onSelect={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('selects a marker, and re-clicking the active one dismisses it', () => {
    const onSelect = vi.fn()
    const { rerender } = render(
      <PassportHotspots hotspots={hotspots} activeIndex={null} onSelect={onSelect} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Chest contour' }))
    expect(onSelect).toHaveBeenCalledWith(1)

    rerender(<PassportHotspots hotspots={hotspots} activeIndex={1} onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: 'Chest contour' })).toHaveProperty(
      'ariaPressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Chest contour' }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})

describe('PassportHotspotDetail', () => {
  it('shows the detail with its position in the set, and dismisses', () => {
    const onDismiss = vi.fn()
    render(
      <PassportHotspotDetail
        hotspot={hotspots[0]!}
        index={0}
        total={2}
        onDismiss={onDismiss}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Shoulder knit' })).toBeTruthy()
    expect(screen.getByText('Detail 1 of 2')).toBeTruthy()
    expect(screen.getByText('Ribbed for load.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onDismiss).toHaveBeenCalled()
  })
})
