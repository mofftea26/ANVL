import { Container } from '@/shared/components/ui/Container'
import type { AboutResolvedContent } from '../content/aboutContent.defaults'
import { AboutMediaFallback } from './AboutMediaFallback'
import { AboutCtaLink } from './AboutCtaLink'
import { BRAND } from '@/shared/constants/brand'

/**
 * Scene 06 — The Oath Continues. Not pinned. The title masks up word-by-word,
 * a steel rule ignites, and the CTAs rise (`buildAboutFinale`). The monolith
 * returns centre/front behind it and lerps to the primary→accent gradient.
 */
export function AboutFinale({ finale, finaleImage }: { finale: AboutResolvedContent['finale']; finaleImage?: string }) {
  return (
    <section
      data-scene="finale"
      className="relative flex w-full flex-col items-center overflow-hidden py-24 text-center md:py-32"
      aria-labelledby="about-finale-heading"
    >
      <AboutMediaFallback media={finaleImage} className="-z-20 opacity-70" vignette />

      <Container className="relative z-10 flex flex-col items-center">
        <p className="anvl-display text-xs tracking-[0.34em] text-[var(--color-heading)]/85">{finale.eyebrow}</p>
        <h2
          id="about-finale-heading"
          data-finale-title
          data-reveal-m
          className="anvl-heading mx-auto mt-5 max-w-4xl font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2.5rem,9vw,6.5rem)]"
        >
          {finale.title}
        </h2>

        <div className="mt-7 h-px w-[min(22rem,70vw)] origin-center">
          <div
            data-finale-rule
            className="h-full w-full origin-center"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-graphite,#5B5E61) 30%, var(--color-heading,#E7E4DF) 50%, var(--color-graphite,#5B5E61) 70%, transparent)',
            }}
          />
        </div>

        <p data-finale-fade data-reveal-m className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
          {finale.body}
        </p>

        <div data-finale-fade data-reveal-m className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <AboutCtaLink href={finale.primaryCta.href} variant="primary">
            {finale.primaryCta.label}
          </AboutCtaLink>
          <AboutCtaLink href={finale.secondaryCta.href} variant="secondary">
            {finale.secondaryCta.label}
          </AboutCtaLink>
        </div>

        <div className="mt-16 w-full border-t border-[var(--color-line)] pt-10">
          <p data-finale-fade data-reveal-m className="anvl-heading font-normal leading-none text-[clamp(2rem,7vw,5rem)]">
            {BRAND.name}
          </p>
          <p data-finale-fade data-reveal-m className="anvl-display mt-2 text-xs tracking-[0.3em] text-[var(--color-heading)]/85">
            {finale.tagline}
          </p>
        </div>
      </Container>
    </section>
  )
}
