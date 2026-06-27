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



  it('renders mobile hero video without loop for one-shot autoplay', () => {

    const { container } = render(<OathHero hero={hero} />)

    const mobileVideo = container.querySelector(

      '[data-hero-video-mobile]',

    ) as HTMLVideoElement | null

    expect(mobileVideo).not.toBeNull()

    expect(mobileVideo!.hasAttribute('loop')).toBe(false)

    expect(mobileVideo!.getAttribute('preload')).toBe('metadata')

  })



  it('fits exactly one viewport height on mobile/tablet', () => {

    const { container } = render(<OathHero hero={hero} />)

    const section = container.querySelector('[data-scene="hero"]')

    expect(section?.className).toMatch(/h-\[100svh\]/)

    expect(section?.className).toMatch(/overflow-hidden/)

  })



  it('keeps hero film in section flow below xl (overlay alignment)', () => {

    const { container } = render(<OathHero hero={hero} />)

    const film = container.querySelector('[data-hero-film]')

    expect(film).not.toBeNull()

    expect(film!.className).toMatch(/\bxl:fixed\b/)

    expect(film!.className).not.toMatch(/\bmd:fixed\b/)

    expect(film!.className).toMatch(/\bmax-xl:w-screen\b/)

    expect(film!.className).toMatch(/\bmax-xl:min-w-full\b/)

    expect(film!.className).toMatch(/\bmax-xl:left-1\/2\b/)

    expect(film!.className).toMatch(/\bmax-xl:-translate-x-1\/2\b/)

    expect(film!.className).toMatch(/\bxl:translate-x-0\b/)

  })



  it('renders a mobile/tablet edge shade with full-width cover below xl', () => {

    const { container } = render(<OathHero hero={hero} />)

    const shade = container.querySelector('[data-hero-mobile-shade]')

    const vignette = container.querySelector('[data-hero-vignette]')

    expect(shade).not.toBeNull()

    expect(shade!.className).toMatch(/\bxl:hidden\b/)

    expect(shade!.className).toMatch(/\binset-0\b/)

    expect(shade!.className).toMatch(/\bmax-xl:w-screen\b/)

    expect(shade!.className).toMatch(/\bmax-xl:left-1\/2\b/)

    expect(vignette!.className).toMatch(/\bmax-xl:w-screen\b/)

    expect(vignette!.className).toMatch(/\bmin-w-full\b/)

  })



  it('sizes hero media panel full width on mobile/tablet only', () => {

    const { container } = render(<OathHero hero={hero} />)

    const media = container.querySelector('[data-hero-media]')

    expect(media).not.toBeNull()

    expect(media!.className).toMatch(/\bmax-xl:w-full\b/)

    expect(media!.className).toMatch(/\bmax-xl:min-w-full\b/)

    expect(media!.className).toMatch(/\binset-0\b/)

    expect(media!.className).not.toMatch(/\bmd:left-\[26%\]/)

    expect(media!.className).toMatch(/\bxl:min-w-0\b/)

    expect(media!.className).toMatch(/xl:w-\[64%\]/)

  })



  it('uses enlarged tablet emblem (md–below xl) with mobile copy offset below emblem', () => {

    const { container } = render(<OathHero hero={hero} />)

    const emblem = container.querySelector('[data-hero-emblem-fallback]')

    const copyStack = container.querySelector('[data-hero-copy-stack]')

    expect(emblem).not.toBeNull()

    expect(copyStack).not.toBeNull()

    expect(emblem!.className).toMatch(/md:max-xl:h-\[clamp\(9rem,18vw,12rem\)\]/)

    expect(emblem!.className).toMatch(/md:max-xl:w-\[clamp\(9rem,18vw,12rem\)\]/)

    expect(emblem!.className).toMatch(/overflow-visible/)

    expect(emblem!.className).toMatch(/\bh-28\b/)

    expect(emblem!.className).toMatch(/\bw-28\b/)

    expect(emblem!.className).toMatch(/max-xl:mx-auto/)

    expect(emblem!.className).not.toMatch(/max-md:-mt-/)

    expect(copyStack!.className).toMatch(/max-md:mt-5/)

    expect(copyStack!.className).toMatch(/md:max-xl:mt-2/)

    expect(emblem!.className).toMatch(/xl:mx-0/)

    expect(emblem!.className).toMatch(/xl:h-\[4\.5rem\]/)

  })



  it('centers hero copy below xl while keeping desktop left-aligned', () => {

    const { container } = render(<OathHero hero={hero} />)

    const content = container.querySelector('[data-hero-content]')

    const headline = container.querySelector('[data-hero-headline]')

    const subhead = content?.querySelector('[data-hero-underline] + [data-hero-fade]')

    const ctaRow = container.querySelector('[data-hero-cta-row]')

    const eyebrow = content?.querySelector('[data-hero-fade]')

    expect(content!.className).toMatch(/max-xl:text-center/)

    expect(content!.className).toMatch(/max-xl:mx-auto/)

    expect(content!.className).toMatch(/xl:text-left/)

    expect(headline!.className).toMatch(/max-xl:mx-auto/)

    expect(headline!.className).toMatch(/max-xl:text-center/)

    expect(headline!.className).toMatch(/xl:mx-0/)

    expect(headline!.className).toMatch(/xl:text-left/)

    expect(subhead!.className).toMatch(/max-xl:mx-auto/)

    expect(subhead!.className).toMatch(/max-xl:text-center/)

    expect(subhead!.className).toMatch(/xl:mx-0/)

    expect(subhead!.className).toMatch(/xl:text-left/)

    expect(eyebrow!.className).toMatch(/max-xl:justify-center/)

    expect(ctaRow!.className).toMatch(/xl:justify-start/)

  })



  it('adds symmetric eyebrow rules on mobile and tablet', () => {

    const { container } = render(<OathHero hero={hero} />)

    const eyebrow = container.querySelector('[data-hero-content] [data-hero-fade]')

    expect(eyebrow).not.toBeNull()

    expect(eyebrow!.className).toMatch(/after:content-\[''\]/)

    expect(eyebrow!.className).toMatch(/after:w-10/)

    expect(eyebrow!.className).toMatch(/md:max-xl:after:w-12/)

    expect(eyebrow!.className).toMatch(/before:content-\[''\]/)

  })



  it('keeps footer rail in the copy column (not stacked above scroll cue)', () => {

    const { container } = render(<OathHero hero={hero} />)

    const content = container.querySelector('[data-hero-content]')

    const footer = content?.querySelector('[data-hero-footer-rail]')

    const scrollCue = container.querySelector('[data-hero-scroll-cue]')

    expect(container.querySelector('[data-hero-bottom-rail]')).toBeNull()

    expect(footer).not.toBeNull()

    expect(scrollCue).not.toBeNull()

    expect(footer!.className).toMatch(/\bmd:flex\b/)

    expect(footer!.className).not.toMatch(/\bxl:hidden\b/)

    expect(content?.contains(scrollCue)).toBe(false)

  })



  it('scales hero typography and CTAs on tablet only (md–below xl)', () => {

    const { container } = render(<OathHero hero={hero} />)

    const headline = container.querySelector('[data-hero-headline]')

    const ctaRow = container.querySelector('[data-hero-cta-row]')

    const primaryCta = ctaRow?.querySelector('a[href="#products"]')

    expect(headline!.className).toMatch(/md:max-xl:text-\[clamp/)

    expect(headline!.className).toMatch(/xl:text-\[clamp\(2\.75rem/)

    expect(primaryCta!.className).toMatch(/md:max-xl:h-14/)

    expect(primaryCta!.className).toMatch(/md:max-xl:text-base/)

  })



  it('centers hero background video on mobile and tablet', () => {

    const { container } = render(<OathHero hero={hero} />)

    const desktopVideo = container.querySelector(

      '[data-hero-video-desktop]',

    ) as HTMLVideoElement | null

    expect(desktopVideo).not.toBeNull()

    expect(desktopVideo!.className).toMatch(/max-xl:object-center/)

    expect(desktopVideo!.className).toMatch(/xl:object-top/)

  })



  it('constrains mobile copy width to prevent overflow', () => {

    const { container } = render(<OathHero hero={hero} />)

    const content = container.querySelector('[data-hero-content]')

    const headline = container.querySelector('[data-hero-headline]')

    expect(content!.className).toMatch(/max-md:flex-col/)

    expect(content!.className).toMatch(/max-md:items-center/)

    expect(headline!.className).toMatch(/max-w-\[min\(100%,18rem\)\]/)

  })

  it('dissolves the bottom edge into the void at every breakpoint', () => {
    const { container } = render(<OathHero hero={hero} />)
    const section = container.querySelector('[data-scene="hero"]')
    expect(section).not.toBeNull()

    const bottomSeams = section!.querySelectorAll('[data-scene-seam="bottom"]')
    expect(bottomSeams).toHaveLength(2)
    expect(bottomSeams[0]!.getAttribute('data-scene-seam-tone')).toBe('subtle')
    expect(bottomSeams[0]!.className).toMatch(/\bxl:hidden\b/)
    expect(bottomSeams[1]!.getAttribute('data-scene-seam-tone')).toBe('default')
    expect(bottomSeams[1]!.className).toMatch(/\bhidden\b/)
    expect(bottomSeams[1]!.className).toMatch(/\bxl:block\b/)
  })

})


