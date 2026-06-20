import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OathSceneSeam } from '../components/OathSceneSeam'

/**
 * The shadow-seam overlay dissolves adjacent scenes into the themed void. It is
 * purely decorative: it must be aria-hidden, ignore pointer events, and only
 * render the edges asked for.
 */
describe('OathSceneSeam', () => {
  it('renders both feathered edges by default, decorative + inert', () => {
    const { container } = render(<OathSceneSeam />)
    const seams = container.querySelectorAll('[data-scene-seam]')
    expect(seams).toHaveLength(2)
    expect(container.querySelector('[data-scene-seam="top"]')).not.toBeNull()
    expect(container.querySelector('[data-scene-seam="bottom"]')).not.toBeNull()
    seams.forEach((seam) => {
      expect(seam.getAttribute('aria-hidden')).toBe('true')
      expect(seam.className).toContain('pointer-events-none')
    })
  })

  it('renders only the requested edge', () => {
    const { container } = render(<OathSceneSeam edges="top" />)
    expect(container.querySelector('[data-scene-seam="top"]')).not.toBeNull()
    expect(container.querySelector('[data-scene-seam="bottom"]')).toBeNull()
  })
})
