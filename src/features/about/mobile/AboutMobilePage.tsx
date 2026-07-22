import { Container } from '@/shared/components/ui/Container'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { usePreviewTargetProps } from '@/features/cms/preview'
import { useHighlightOnArrival } from '@/shared/hooks/useHighlightOnArrival'
import { BRAND } from '@/shared/constants/brand'
import type { AboutResolvedContent, AboutResolvedOrb } from '../content/aboutContent.defaults'
import { orbImage } from '../content/resolveAboutContent'
import type { AboutPageAssets } from '../index'
import { AboutCtaLink } from '../components/AboutCtaLink'
import { AboutOrbContent, AboutOrbHeroBand } from '../components/AboutOrbContent'
import { AboutMarquee } from '../components/AboutMarquee'

/**
 * One orb rendered as a normal page section — the orbs ARE the About
 * sections on mobile. Shares the orb content presentation with the desktop
 * altar's strike modal ({@link AboutOrbContent} / {@link AboutOrbHeroBand}),
 * with the orb's own color as the section accent.
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

  return (
    <section
      id={anchorId}
      className="scroll-mt-[var(--anvl-header-h)] py-12 md:py-16"
      aria-labelledby={`${anchorId}-title`}
      {...previewTarget}
    >
      <Container className="max-w-3xl">
        <RevealOnScroll>
          <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            {image ? (
              <AboutOrbHeroBand orb={orb} image={image} />
            ) : (
              // No image — the orb-colored hairline alone carries its identity.
              <span
                aria-hidden="true"
                className="block h-px w-full"
                style={{
                  background: `linear-gradient(90deg, ${orb.color}, color-mix(in srgb, ${orb.color} 30%, transparent) 70%, transparent)`,
                }}
              />
            )}
            <div className="p-6 md:p-8">
              <AboutOrbContent
                orb={orb}
                headingId={`${anchorId}-title`}
                variant="section"
              />
            </div>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  )
}

/**
 * The normal About page — mobile, tablet, reduced-motion, and no-WebGL
 * desktop all land here. A clean scrolling page: full-bleed hero under the
 * transparent header, then **one section per orb** (the same CMS orbs that
 * orbit the desktop altar), the marquee band, and the closing brand block.
 * Light once-only reveals (IntersectionObserver + CSS), native scroll, no pins, no WebGL.
 */
export function AboutMobilePage({
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
        className="relative flex min-h-[86svh] items-end overflow-hidden pb-14 pt-[calc(var(--anvl-header-h)+3rem)]"
        aria-labelledby="about-hero-heading"
        {...heroPreviewTarget}
      >
        <div className="absolute inset-0 -z-10">
          {assets.heroImage ? (
            <img
              src={assets.heroImage}
              alt=""
              width={2560}
              height={1440}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(ellipse 120% 90% at 55% 35%, var(--color-surface-elevated,#1D1F21) 0%, var(--color-bg,#0B0B0C) 70%)',
              }}
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 42%, transparent) 0%, transparent 34%, color-mix(in srgb, var(--color-bg) 88%, transparent) 88%, var(--color-bg) 100%)',
            }}
          />
        </div>
        <Container>
          <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-highlight-bright)] before:h-px before:w-8 before:bg-[var(--color-highlight)] before:content-['']">
            {content.hero.eyebrow}
          </p>
          <h1
            id="about-hero-heading"
            className="anvl-heading mt-4 max-w-3xl font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2.5rem,10vw,5rem)] text-[var(--color-heading)]"
          >
            {content.hero.headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            {content.hero.subhead}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AboutCtaLink href={content.hero.primaryCta.href} variant="primary">
              {content.hero.primaryCta.label}
            </AboutCtaLink>
            <AboutCtaLink href={content.hero.secondaryCta.href} variant="secondary">
              {content.hero.secondaryCta.label}
            </AboutCtaLink>
          </div>
        </Container>
        {/* CMS scroll cue — invites the reader down into the orb sections. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/70">
            {content.hero.scrollCue} ↓
          </span>
        </div>
      </section>

      {/* The orbs — one section each. */}
      {content.orbs.map((orb, i) => (
        <OrbSection key={orb.id} orb={orb} image={orbImage(orb, assets)} index={i} />
      ))}

      <div {...marqueePreviewTarget}>
        <AboutMarquee text={content.marquee.text} />
      </div>

      {/* Closing brand block. */}
      <section className="py-16 text-center md:py-20">
        <Container>
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
