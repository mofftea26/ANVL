import { describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import AboutScrollExperience from '@/features/about/scroll/AboutScrollExperience'
import { resolveAboutContent } from '@/features/about/content/resolveAboutContent'
import type { AboutResolvedContent } from '@/features/about/content/aboutContent.defaults'

/**
 * DOM-contract test for the film's markup. jsdom's `matchMedia` mock always
 * reports `matches: false`, so the cinematic matchMedia branch never builds,
 * no pins mount, and the lazy altar chunk never loads (`isWebglAvailable` is
 * false) — what renders is the raw scene markup, which is exactly the
 * contract the admin live preview, the search corpus, and the timeline hook
 * all depend on. The CTAs are router links, so the film renders inside a
 * memory-history router (the AdminShellLayout test's pattern).
 */
async function renderFilm(content: AboutResolvedContent) {
  const rootRoute = createRootRoute({
    component: () => <AboutScrollExperience content={content} assets={{}} />,
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const view = render(<RouterProvider router={router} />)
  await waitFor(() => {
    expect(view.container.querySelector('[data-scene="hero"]')).not.toBeNull()
  })
  return view
}

describe('AboutScrollExperience — scene contract', () => {
  const content = resolveAboutContent(undefined, {})

  it('renders one h1, every chapter anchored and ordered, and the finale', async () => {
    const { container } = await renderFilm(content)

    expect(container.querySelectorAll('h1')).toHaveLength(1)

    const chapters = Array.from(container.querySelectorAll('[data-scene="orb"]'))
    expect(chapters).toHaveLength(content.orbs.length)
    chapters.forEach((section, index) => {
      // Search-corpus deep-link anchor, in orb order.
      expect(section.id).toBe(`about-orb-${content.orbs[index].id}`)
      // The timeline hook's per-chapter index hook.
      expect(section.getAttribute('data-orb-index')).toBe(String(index))
      // Every chapter is a labelled region with its own heading.
      const headingId = section.getAttribute('aria-labelledby')
      expect(headingId).toBe(`about-orb-${content.orbs[index].id}-title`)
      expect(section.querySelector(`#${CSS.escape(headingId ?? '')}`)).not.toBeNull()
    })

    expect(container.querySelector('[data-scene="marquee"]')).not.toBeNull()
    const altar = container.querySelector('[data-scene="altar"]')
    expect(altar).not.toBeNull()
    expect(altar?.id).toBe('about-altar')
  })

  it('keeps chapter markup carrying the reveal + stat markers the builder scrubs', async () => {
    const { container } = await renderFilm(content)
    const chapter = container.querySelector('[data-scene="orb"]')
    expect(chapter?.querySelectorAll('[data-orb-reveal]').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('[data-chapter-num]')).toHaveLength(content.orbs.length)
  })

  it('scales the chapter set with the CMS orb list', async () => {
    const three = resolveAboutContent(
      { orbs: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] },
      {},
    )
    const { container } = await renderFilm(three)
    expect(container.querySelectorAll('[data-scene="orb"]')).toHaveLength(3)
  })
})
