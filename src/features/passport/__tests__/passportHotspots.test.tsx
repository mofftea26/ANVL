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
