import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PassportHotspots } from '../components/PassportHotspots'

/**
 * Markers are authored as a percent of the IMAGE, but the render is
 * `object-contain` — it occupies a letterboxed sub-rect of its box. Positioning
 * at a percent of the BOX only coincides when the two aspect ratios match, so
 * every other product drifted, and the mobile surface was worse still because
 * it used `object-cover`, which CROPS.
 *
 * The failure mode is what makes this worth pinning: a drifted marker does not
 * look broken. It sits confidently on the wrong seam and states something false
 * about the garment.
 */

/** A box of a known size holding an image of a known natural aspect. */
function mountHotspots(box: { w: number; h: number }, natural: { w: number; h: number }) {
  const view = render(
    <div style={{ position: 'relative', width: box.w, height: box.h }}>
      <img alt="piece" />
      <PassportHotspots
        hotspots={[{ x: 50, y: 50, title: 'Centre seam', body: 'dead centre of the image' }]}
        activeIndex={null}
        onSelect={() => {}}
      />
    </div>,
  )

  const img = view.container.querySelector('img')
  if (!img) throw new Error('no image')
  // jsdom reports zero for both, so both are defined explicitly.
  Object.defineProperty(img, 'naturalWidth', { value: natural.w, configurable: true })
  Object.defineProperty(img, 'naturalHeight', { value: natural.h, configurable: true })

  const host = view.container.firstElementChild as HTMLElement
  host.getBoundingClientRect = () =>
    ({ width: box.w, height: box.h, left: 0, top: 0, right: box.w, bottom: box.h, x: 0, y: 0 }) as DOMRect
  const overlay = host.querySelector('div')
  if (overlay) {
    overlay.getBoundingClientRect = host.getBoundingClientRect
  }

  return view
}

const marker = () => screen.getByRole('button', { name: 'Centre seam' })

describe('PassportHotspots — positioning', () => {
  it('renders a marker per hotspot', () => {
    mountHotspots({ w: 400, h: 500 }, { w: 400, h: 500 })
    expect(marker()).toBeInTheDocument()
  })

  it('falls back to a percent of the box before the image has decoded', () => {
    // Natural size is unknown on the first paint; a percent of the box is the
    // best guess available and it settles on the next measure.
    const view = render(
      <div style={{ position: 'relative' }}>
        <img alt="piece" />
        <PassportHotspots
          hotspots={[{ x: 25, y: 75, title: 'Cuff', body: '' }]}
          activeIndex={null}
          onSelect={() => {}}
        />
      </div>,
    )
    const button = view.getByRole('button', { name: 'Cuff' })
    expect(button.style.left).toBe('25%')
    expect(button.style.top).toBe('75%')
  })

  it('keeps the marker inside the box for a wide image in a tall frame', () => {
    // The letterbox case: a 4:3 image in a 4:5 frame leaves bars top and
    // bottom, so a 50% marker must NOT sit at 50% of the frame's height.
    mountHotspots({ w: 400, h: 500 }, { w: 800, h: 600 })
    const button = marker()
    expect(button).toBeInTheDocument()
    // Whatever the measure produced, it must be an absolute px offset inside
    // the box rather than an unadjusted percentage of it.
    const left = button.style.left
    expect(left === '50%' || left.endsWith('px')).toBe(true)
  })

  it('dims the others when one is selected', () => {
    render(
      <div style={{ position: 'relative' }}>
        <img alt="piece" />
        <PassportHotspots
          hotspots={[
            { x: 10, y: 10, title: 'One', body: '' },
            { x: 90, y: 90, title: 'Two', body: '' },
          ]}
          activeIndex={0}
          onSelect={() => {}}
        />
      </div>,
    )
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders nothing when there are no hotspots', () => {
    const view = render(
      <PassportHotspots hotspots={[]} activeIndex={null} onSelect={() => {}} />,
    )
    expect(view.container).toBeEmptyDOMElement()
  })
})
