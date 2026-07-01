import { ChevronDown } from 'lucide-react'
import { Container } from '@/shared/components/ui/Container'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { AboutMediaFallback } from './AboutMediaFallback'
import { AboutCtaLink } from './AboutCtaLink'

/**
 * Scene 01 — Hero ("Forged in Beirut"). Full-bleed backdrop behind the copy;
 * the 3D monolith (when assigned) drifts to centre behind the headline as the
 * hero scrolls (`buildAboutHero` → `heroProgress`). Not pinned — the page
 * keeps moving under it.
 */
export function AboutHero({
  hero,
  heroImage,
}: {
  hero: AboutResolvedContent['hero']
  heroImage?: string
}) {
  return (
    <section
      data-scene="hero"
      className="relative flex h-[100svh] w-full items-center overflow-hidden"
      aria-labelledby="about-hero-heading"
    >
      <AboutMediaFallback media={heroImage} className="-z-20" layerAttrs={{ 'data-hero-media': '1' }} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(90deg, color-mix(in srgb, var(--color-bg) 85%, transparent) 0%, color-mix(in srgb, var(--color-bg) 45%, transparent) 42%, transparent 72%)',
        }}
      />

      <Container className="relative z-10 w-full">
        <div data-hero-content className="max-w-2xl will-change-transform">
          <p
            data-hero-fade
            data-reveal-m
            className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-highlight-bright)] before:h-px before:w-8 before:bg-[var(--color-highlight)] before:content-['']"
          >
            {hero.eyebrow}
          </p>
          <h1
            id="about-hero-heading"
            data-hero-headline
            data-reveal-m
            className="anvl-heading mt-5 max-w-3xl font-normal leading-[0.88] tracking-[-0.01em] text-[clamp(2.75rem,9vw,6.5rem)] text-[var(--color-heading)]"
          >
            {hero.headline}
          </h1>
          <div
            data-hero-underline
            className="mt-4 h-px w-[min(20rem,56vw)] origin-left"
            style={{
              background:
                'linear-gradient(90deg, var(--color-highlight-bright, #e08a4a), var(--color-highlight, #c2703d) 55%, transparent)',
            }}
          />
          <p
            data-hero-fade
            data-reveal-m
            className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg"
          >
            {hero.subhead}
          </p>
          <div data-hero-fade data-reveal-m className="mt-9 flex flex-wrap gap-3">
            <AboutCtaLink href={hero.primaryCta.href} variant="primary">
              {hero.primaryCta.label}
            </AboutCtaLink>
            <AboutCtaLink href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </AboutCtaLink>
          </div>
        </div>
      </Container>

      <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-1.5">
        <span className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/85">
          {hero.scrollCue}
        </span>
        <ChevronDown size={14} aria-hidden="true" data-hero-scroll-cue className="text-[var(--color-heading)]/90" />
      </div>
    </section>
  )
}
