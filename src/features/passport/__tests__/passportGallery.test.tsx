import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PassportGallery } from '../components/PassportGallery'
import { PASSPORT_SECTIONS } from '../components/console/passportSections'
import type { PassportSectionContext } from '../components/console/passportSections'

/**
 * `piece.gallery` was authored in the CMS and reached nothing: all four
 * consumers read `gallery[0]`, and only as a fallback for a missing hero
 * render, so every image after the first existed solely in the database.
 */

const views = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ src: `/view-${i}.webp`, alt: `View ${i}` }))

describe('PassportGallery', () => {
  it('shows the first view and a thumbnail per image', () => {
    render(<PassportGallery gallery={views(3)} productName="Oversized Tee" />)
    expect(screen.getByRole('img', { name: 'View 0' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('switches the large frame when a thumbnail is chosen', async () => {
    const user = userEvent.setup()
    render(<PassportGallery gallery={views(3)} productName="Oversized Tee" />)

    await user.click(screen.getByRole('button', { name: 'View 3 of 3' }))

    expect(screen.getByRole('img', { name: 'View 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View 3 of 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('drops the rail for a single image', () => {
    render(<PassportGallery gallery={views(1)} productName="Oversized Tee" />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('renders nothing at all when there is no gallery', () => {
    const view = render(<PassportGallery gallery={[]} productName="Oversized Tee" />)
    expect(view.container).toBeEmptyDOMElement()
  })
})

describe('the piece section', () => {
  const section = PASSPORT_SECTIONS.find((s) => s.key === 'piece')

  function ctx(galleryLength: number): PassportSectionContext {
    return {
      view: { productName: 'Oversized Tee' },
      content: { piece: { gallery: views(galleryLength) } },
    } as unknown as PassportSectionContext
  }

  it('is registered under The Craft', () => {
    expect(section).toBeDefined()
    expect(section?.group).toBe('craft')
  })

  it('opens only when there is more than the hero to show', () => {
    // One image is already the hero on both surfaces, so a section holding just
    // that would repeat what is on screen.
    expect(section?.available(ctx(0))).toBe(false)
    expect(section?.available(ctx(1))).toBe(false)
    expect(section?.available(ctx(4))).toBe(true)
  })

  it('teases the number of views', () => {
    expect(section?.teaser(ctx(4))).toContain('4 views')
  })
})
