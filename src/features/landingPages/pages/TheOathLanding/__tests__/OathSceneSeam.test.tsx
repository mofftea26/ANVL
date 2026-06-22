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

      expect(seam.getAttribute('data-scene-seam-tone')).toBe('default')

    })

  })



  it('renders only the requested edge', () => {

    const { container } = render(<OathSceneSeam edges="top" />)

    expect(container.querySelector('[data-scene-seam="top"]')).not.toBeNull()

    expect(container.querySelector('[data-scene-seam="bottom"]')).toBeNull()

  })



  it('marks subtle tone for mobile/tablet hand-offs', () => {

    const { container } = render(<OathSceneSeam edges="bottom" tone="subtle" />)

    const bottom = container.querySelector('[data-scene-seam="bottom"]')

    expect(bottom).not.toBeNull()

    expect(bottom!.getAttribute('data-scene-seam-tone')).toBe('subtle')

    expect(bottom!.className).toMatch(/\bh-44\b/)

  })



  it('uses taller default overlays on xl for cinematic hand-offs', () => {
    const { container } = render(<OathSceneSeam edges="bottom" />)
    const bottom = container.querySelector('[data-scene-seam="bottom"]')
    expect(bottom).not.toBeNull()
    expect(bottom!.className).toMatch(/\bxl:h-52\b/)
  })

  it('marks blend tone without painting opaque bg color', () => {
    const { container } = render(<OathSceneSeam edges="bottom" tone="blend" />)
    const bottom = container.querySelector('[data-scene-seam="bottom"]')
    expect(bottom).not.toBeNull()
    expect(bottom!.getAttribute('data-scene-seam-tone')).toBe('blend')
    expect(bottom!.className).toMatch(/\bxl:h-64\b/)
    expect(bottom!.getAttribute('style')).toBeNull()
  })

  it('paints opaque bg feather for solid section hand-offs', () => {
    const { container } = render(<OathSceneSeam edges="top" tone="opaque" />)
    const top = container.querySelector('[data-scene-seam="top"]')
    expect(top).not.toBeNull()
    expect(top!.getAttribute('data-scene-seam-tone')).toBe('opaque')
    expect(top!.className).toMatch(/\bxl:h-64\b/)
    expect(top!.getAttribute('style')).toMatch(/var\(--color-bg\)/)
  })

  it('merges optional className onto seam overlays', () => {
    const { container } = render(
      <OathSceneSeam edges="top" className="hidden xl:block" />,
    )

    const top = container.querySelector('[data-scene-seam="top"]')

    expect(top).not.toBeNull()

    expect(top!.className).toMatch(/\bhidden\b/)

    expect(top!.className).toMatch(/\bxl:block\b/)

  })

})

