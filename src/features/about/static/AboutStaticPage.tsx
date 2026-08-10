import { Container } from '@/shared/components/ui/Container'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { usePreviewTargetProps } from '@/features/cms/preview'
import { useHighlightOnArrival } from '@/shared/hooks/useHighlightOnArrival'
import { BRAND } from '@/shared/constants/brand'
import { cn } from '@/shared/lib/cn'
import type { AboutResolvedContent, AboutResolvedOrb } from '../content/aboutContent.defaults'
import { orbImage } from '../content/resolveAboutContent'
import type { AboutPageAssets } from '../index'
import { AboutCtaLink } from '../components/AboutCtaLink'
import { AboutOrbContent } from '../components/AboutOrbContent'
import { AboutMarquee } from '../components/AboutMarquee'

/**
 * One orb as a full-screen static chapter — the film's art direction without
 * the film: the orb's image is a faded full-bleed backdrop under a legibility
 * wash, the copy rides over it (alternating alignment for rhythm at wider
 * widths), the chapter ordinal is an outlined ghost numeral. Reveals are
 * IntersectionObserver + CSS only — no pins, no GSAP, no WebGL.
 */
function OrbSection({
  orb,
  image,
  index,
}: {
  orb: AboutResolvedOrb
  image?: string
  index: number
}) {
  const anchorId = `about-orb-${orb.id}`
  useHighlightOnArrival(anchorId)
  // Index-based target — matches the admin orbs editor, which only knows
  // positions (resolved ids are semantic for the designed defaults).
  const previewTarget = usePreviewTargetProps('content-field', `about:orb-${index + 1}`)
  const alignEnd = index % 2 === 1

  return (
    <section
      id={anchorId}
      className="relative flex min-h-svh scroll-mt-[var(--anvl-header-h)] items-center overflow-hidden py-16 md:py-20"
      aria-labelledby={`${anchorId}-title`}
      {...previewTarget}
    >
      <div aria-hidden="true" className="absolute inset-0">
        {image ? (
          <img
            src={image}
            alt=""
            width={2560}
            height={1440}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-55"
          />
        ) : (
          // No image — the orb's own colour breathes in the void.
          <div
            className="h-full w-full"
            style={{
              background: `radial-gradient(ellipse 90% 70% at 50% 40%, color-mix(in srgb, ${orb.color} 13%, transparent) 0%, transparent 62%)`,
            }}
          />
        )}
        {/* Legibility wash — heavier over the copy, grounded at the edges. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 62%, transparent) 0%, color-mix(in srgb, var(--color-bg) 30%, transparent) 30%, color-mix(in srgb, var(--color-bg) 42%, transparent) 74%, var(--color-bg) 100%)',
          }}
        />
      </div>

      {/* Ghost ordinal — the chapter's number as set dressing. */}
      <span
        aria-hidden="true"
        className={cn(
          'about-outline-text anvl-heading pointer-events-none absolute bottom-[3vh] select-none leading-none text-transparent opacity-40 text-[clamp(6rem,18vw,11rem)]',
          alignEnd ? 'left-[4vw]' : 'right-[4vw]',
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <Container className="relative z-10">
        <RevealOnScroll>
          <div className={cn('max-w-2xl', alignEnd && 'md:ml-auto')}>
            <AboutOrbContent orb={orb} headingId={`${anchorId}-title`} variant="section" />
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  )
}

/**
 * The static About page — mobile, tablet, reduced-motion, and SSR all land
 * here, in the same art direction as the desktop film: a full-bleed hero,
 * one full-screen faded-backdrop chapter per CMS orb, the marquee band, and
 * the closing brand block over the finale imagery. Native scroll, light
 * once-only reveals, no pins, no WebGL.
 */
export function AboutStaticPage({
  content,
  assets,
}: {
  content: AboutResolvedContent
  assets: AboutPageAssets
}) {
  const heroPreviewTarget = usePreviewTargetProps('content-field', 'about:hero')
  const marqueePreviewTarget = usePreviewTargetProps('content-field', 'about:marquee')

  return (
    <div className="relative">
      {/* Hero — full-bleed under the transparent header. */}
      <section
        className="relative flex min-h-svh items-center overflow-hidden py-[calc(var(--anvl-header-h)+2rem)]"
        aria-labelledby="about-hero-heading"
        {...heroPreviewTarget}
      >
        <div aria-hidden="true" className="absolute inset-0">
          {assets.heroImage ? (
            <img
              src={assets.heroImage}
              alt=""
              width={2560}
              height={1440}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover opacity-65"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(ellipse 120% 90% at 55% 35%, var(--color-surface-elevated,#1D1F21) 0%, var(--color-bg,#0B0B0C) 70%)',
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 50% 46%, color-mix(in srgb, var(--color-bg) 28%, transparent) 0%, transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 52%, transparent) 0%, transparent 32%, transparent 64%, var(--color-bg) 100%)',
            }}
          />
        </div>
        <Container className="relative z-10 text-center">
          <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-highlight-bright)]">
            <span aria-hidden="true" className="h-px w-7 bg-[var(--color-highlight)]" />
            {content.hero.eyebrow}
            <span aria-hidden="true" className="h-px w-7 bg-[var(--color-highlight)]" />
          </p>
          <h1
            id="about-hero-heading"
            className="anvl-heading mx-auto mt-5 max-w-3xl font-normal uppercase leading-[0.9] tracking-[-0.01em] text-[clamp(2.75rem,11vw,5.5rem)] text-[var(--color-heading)]"
          >
            {content.hero.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            {content.hero.subhead}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <AboutCtaLink href={content.hero.primaryCta.href} variant="primary">
              {content.hero.primaryCta.label}
            </AboutCtaLink>
            <AboutCtaLink href={content.hero.secondaryCta.href} variant="secondary">
              {content.hero.secondaryCta.label}
            </AboutCtaLink>
          </div>
        </Container>
        {/* CMS scroll cue — invites the reader down into the chapters. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
          <span className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/70">
            {content.hero.scrollCue} ↓
          </span>
        </div>
      </section>

      {/* The orbs — one full-screen chapter each. */}
      {content.orbs.map((orb, i) => (
        <OrbSection key={orb.id} orb={orb} image={orbImage(orb, assets)} index={i} />
      ))}

      <div {...marqueePreviewTarget}>
        <AboutMarquee text={content.marquee.text} />
      </div>

      {/* Closing brand block — over the finale imagery when assigned. */}
      <section className="relative overflow-hidden py-20 text-center md:py-24">
        {assets.finaleBackdrop ? (
          <div aria-hidden="true" className="absolute inset-0">
            <img
              src={assets.finaleBackdrop}
              alt=""
              width={2560}
              height={1440}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-35"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, var(--color-bg) 0%, transparent 40%, var(--color-bg) 100%)',
              }}
            />
          </div>
        ) : null}
        <Container className="relative z-10">
          <RevealOnScroll>
            <div className="border-t border-[var(--color-line)] pt-10">
              <p className="anvl-heading font-normal leading-none text-[clamp(1.75rem,6vw,3.5rem)] text-[var(--color-heading)]">
                {BRAND.name}
              </p>
              <p className="anvl-display mt-2 text-xs tracking-[0.3em] text-[var(--color-highlight-bright)]">
                {BRAND.tagline}
              </p>
            </div>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  )
}
