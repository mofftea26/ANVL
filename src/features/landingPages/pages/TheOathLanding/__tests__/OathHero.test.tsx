import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OathHero } from '../components/OathHero'
import { OATH_DEFAULT_CONTENT } from '../content/oathContent.defaults'

/**
 * The hero composition contract the restored right→centre motion depends on:
 * the base film lives in a single `[data-hero-media]` panel (the element
 * `buildOathHero` translates), and the cursor spotlight reveal is a *separate*
 * stationary layer — never a descendant of the moving panel — so its mask
 * coordinates stay correct while the video drifts.
 */
const hero = {
  ...OATH_DEFAULT_CONTENT.hero,
  // Hash hrefs render native anchors (no router needed in the test).
  primaryCta: { label: 'Explore Drop 01', href: '#products' },
  secondaryCta: { label: 'Join Waitlist', href: '#waitlist' },
}

describe('OathHero', () => {
  it('renders the headline and both CTAs', () => {
    render(<OathHero hero={hero} />)
    expect(
      screen.getByRole('heading', { name: hero.headline }),
    ).toBeInTheDocument()
    expect(screen.getByText('Explore Drop 01')).toBeInTheDocument()
    expect(screen.getByText('Join Waitlist')).toBeInTheDocument()
  })

  it('wraps the base film in a single drifting [data-hero-media] panel', () => {
    const { container } = render(<OathHero hero={hero} />)
    const panels = container.querySelectorAll('[data-hero-media]')
    expect(panels).toHaveLength(1)
    // The desktop video (scrubbed + carried by the drift) lives inside the panel.
    expect(
      panels[0].querySelector('[data-hero-video-desktop]'),
    ).not.toBeNull()
  })

  it('renders a static drop emblem above the eyebrow (WebGL fallback)', () => {
    const { container } = render(<OathHero hero={hero} />)
    const content = container.querySelector('[data-hero-content]')
    const emblem = content?.querySelector('[data-hero-emblem-fallback]')
    const eyebrow = content?.querySelector('[data-hero-fade]')
    expect(emblem).not.toBeNull()
    expect(eyebrow).not.toBeNull()
    // The emblem precedes the eyebrow in the copy column (sits above it).
    expect(
      emblem!.compareDocumentPosition(eyebrow!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('keeps the spotlight reveal outside the moving panel', () => {
    const { container } = render(<OathHero hero={hero} />)
    const panel = container.querySelector('[data-hero-media]')
    const spotlight = container.querySelector('[data-hero-spotlight]')
    expect(panel).not.toBeNull()
    expect(spotlight).not.toBeNull()
    // Stationary layer must not be nested in the translated panel.
    expect(panel?.contains(spotlight)).toBe(false)
  })
})
