import { Container } from '@/shared/components/ui/Container'
import { usePreviewTargetProps } from '@/features/cms/preview'
import type { AboutResolvedContent } from '../../content/aboutContent.defaults'
import { AboutCtaLink } from '../../components/AboutCtaLink'

/**
 * Chapter 00 — the cold open. Full-screen centred headline over the hero
 * backdrop (the LCP image). Markup + `data-*` hooks only: `buildAboutHero`
 * owns the entry forge-in and the pinned descent scrub.
 */
export function AboutHeroSection({
  hero,
  image,
}: {
  hero: AboutResolvedContent['hero']
  image?: string
}) {
  const previewTarget = usePreviewTargetProps('content-field', 'about:hero')

  return (
    <section
      data-scene="hero"
      aria-labelledby="about-hero-heading"
      className="relative flex h-[100svh] items-center overflow-hidden"
      {...previewTarget}
    >
      <div aria-hidden="true" className="absolute inset-0">
        <div data-hero-backdrop className="absolute inset-0 will-change-transform">
          {image ? (
            <img
              src={image}
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
        </div>
        {/* Legibility wash — clears the centre, grounds the frame edges. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 68% 55% at 50% 48%, color-mix(in srgb, var(--color-bg) 30%, transparent) 0%, transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 55%, transparent) 0%, transparent 30%, transparent 62%, var(--color-bg) 100%)',
          }}
        />
      </div>

      <div data-hero-content className="relative z-10 w-full will-change-transform">
        <Container className="text-center">
          <p
            data-hero-fade
            className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.34em] text-[var(--color-highlight-bright)]"
          >
            <span aria-hidden="true" className="h-px w-8 bg-[var(--color-highlight)]" />
            {hero.eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-[var(--color-highlight)]" />
          </p>
          <h1
            id="about-hero-heading"
            data-hero-headline
            className="anvl-heading mx-auto mt-6 max-w-5xl font-normal uppercase leading-[0.88] tracking-[-0.01em] text-[clamp(3.5rem,7.5vw,8rem)] text-[var(--color-heading)]"
          >
            {hero.headline}
          </h1>
          <p
            data-hero-fade
            className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] xl:text-lg"
          >
            {hero.subhead}
          </p>
          <div data-hero-fade className="mt-9 flex flex-wrap justify-center gap-3">
            <AboutCtaLink href={hero.primaryCta.href} variant="primary">
              {hero.primaryCta.label}
            </AboutCtaLink>
            <AboutCtaLink href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </AboutCtaLink>
          </div>
        </Container>
      </div>

      <div
        data-hero-scroll-cue
        className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
      >
        <span className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/70">
          {hero.scrollCue} ↓
        </span>
      </div>
    </section>
  )
}
