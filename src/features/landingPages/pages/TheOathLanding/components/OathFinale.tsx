import { Container } from '@/shared/components/ui/Container'
import {
  OATH_BRAND_NAME,
  type OathResolvedContent,
} from '../content/oathContent.defaults'
import { OathCmsMark } from './OathCmsMark'
import { OathCtaLink } from './OathCtaLink'

/**
 * Scene 05 — Take the Oath. The crest reveals, the title masks up word-by-word,
 * a steel rule ignites, and the monumental brand block rises — then normal page
 * scroll (the footer) continues, so the cinematic never traps the user. The
 * monolith returns centre/front behind it (`finaleProgress`).
 */
export function OathFinale({ finale }: { finale: OathResolvedContent['finale'] }) {
  return (
    <section
      data-scene="finale"
      id="oath"
      className="relative flex w-full scroll-mt-[var(--anvl-header-h)] flex-col items-center overflow-hidden pt-20 pb-4 text-center md:pt-28 md:pb-6"
      aria-labelledby="oath-finale-heading"
    >
      {/* No top seam here — the products→finale transition is intentionally
          continuous (the shadow seam was removed at this boundary). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-20%] z-[1] h-[55%]"
        style={{
          background:
            'radial-gradient(ellipse 32% 60% at 50% 100%, color-mix(in srgb, var(--anvl-bone, #E7E4DF) 4%, transparent), transparent 70%)',
        }}
      />

      <Container className="relative z-10 flex flex-col items-center">
        <div data-finale-crest data-reveal-m className="mb-10 will-change-transform">
          <OathCmsMark slot="crestSvg" className="h-24 w-auto md:h-28" width={112} height={112} />
        </div>

        <p
          data-finale-fade
          data-reveal-m
          className="anvl-display text-xs tracking-[0.34em] text-[var(--color-heading)]/85"
        >
          {finale.eyebrow}
        </p>

        <h2
          id="oath-finale-heading"
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
                'linear-gradient(90deg, transparent, var(--color-graphite,#5B5E61) 30%, var(--anvl-bone,#E7E4DF) 50%, var(--color-graphite,#5B5E61) 70%, transparent)',
            }}
          />
        </div>

        <p
          data-finale-fade
          data-reveal-m
          className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]"
        >
          {finale.body}
        </p>

        <div
          data-finale-fade
          data-reveal-m
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <OathCtaLink href={finale.primaryCta.href} variant="primary">
            {finale.primaryCta.label}
          </OathCtaLink>
          <OathCtaLink href={finale.secondaryCta.href} variant="secondary">
            {finale.secondaryCta.label}
          </OathCtaLink>
        </div>

        <div className="mt-16 w-full border-t border-[var(--color-line)] pt-10">
          <p className="overflow-hidden">
            <span
              data-finale-brand
              data-reveal-m
              className="anvl-heading block font-normal leading-none text-[clamp(2rem,7vw,5rem)] will-change-transform"
            >
              {OATH_BRAND_NAME}
            </span>
          </p>
          <p className="mt-2 overflow-hidden">
            <span
              data-finale-brand
              data-reveal-m
              className="anvl-display block text-xs tracking-[0.3em] text-[var(--color-heading)]/85 will-change-transform"
            >
              {finale.tagline}
            </span>
          </p>
        </div>
      </Container>
    </section>
  )
}
