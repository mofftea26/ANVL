import { Container } from '@/shared/components/ui/Container'
import { WarBanner } from '@/shared/components/premium/WarBanner'
import { OATH_FINAL } from '../data'
import { MediaPlane } from './MediaPlane'
import { OathCtaLink } from './OathCtaLink'

/**
 * Scene 05 — The Drop, as a closing vow. A war-banner crest drops from above,
 * the headline masks up word-by-word, an ember rule ignites across, and the
 * monumental wordmark rises — then normal page scroll (the footer) continues, so
 * the cinematic never traps the user. Motion lives in `buildFinal`.
 */
export function FinalDropCTA() {
  return (
    <section
      data-scene="final"
      id="oath"
      className="relative flex min-h-[var(--anvl-section-h)] w-full scroll-mt-[var(--anvl-header-h)] flex-col items-center justify-center overflow-hidden bg-transparent py-24 text-center"
      aria-labelledby="oath-final-heading"
    >
      <MediaPlane tone="#0d0e10" showLogo={false} grain transparent vignette={false} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-25%] z-[1] h-[80%]"
        style={{
          background:
            'radial-gradient(ellipse 70% 100% at 50% 100%, var(--color-ember-soft), transparent 65%)',
        }}
      />

      <Container className="relative z-10 flex flex-col items-center">
        {/* Crest banner — drops in from above. */}
        <div data-final-crest className="mb-10 w-[clamp(8rem,22vw,12rem)] will-change-transform [perspective:1200px]">
          <WarBanner tone="#1b130d" label="DR-01">
            <p className="anvl-display text-center text-[9px] tracking-[0.3em] text-[var(--color-ember-bright)]">
              The Oath
            </p>
          </WarBanner>
        </div>

        <p data-final-fade className="anvl-display text-xs tracking-[0.34em] text-[var(--color-ember-bright)]">
          {OATH_FINAL.eyebrow}
        </p>

        <h2
          id="oath-final-heading"
          className="anvl-heading mx-auto mt-5 max-w-4xl font-normal leading-[0.86] tracking-[-0.01em] text-[clamp(2.5rem,9vw,6.5rem)]"
        >
          {OATH_FINAL.title.split(' ').map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.04em] align-bottom">
              <span data-final-word className="inline-block will-change-transform">
                {word}
                {' '}
              </span>
            </span>
          ))}
        </h2>

        {/* Igniting ember rule. */}
        <div className="mt-7 h-[2px] w-[min(22rem,70vw)] origin-center">
          <div
            data-final-rule
            className="h-full w-full origin-center"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-ember) 30%, var(--color-ember-bright) 50%, var(--color-ember) 70%, transparent)',
            }}
          />
        </div>

        <p data-final-fade className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
          {OATH_FINAL.body}
        </p>

        <div data-final-fade className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <OathCtaLink href={OATH_FINAL.primaryCta.href} variant="primary">
            {OATH_FINAL.primaryCta.label}
          </OathCtaLink>
          <OathCtaLink href={OATH_FINAL.secondaryCta.href} variant="secondary">
            {OATH_FINAL.secondaryCta.label}
          </OathCtaLink>
        </div>

        <div className="mt-16 w-full border-t border-[var(--color-line)] pt-10">
          <p className="overflow-hidden" data-final-line>
            <span
              data-final-inner
              className="anvl-heading block font-normal leading-none text-[clamp(2rem,7vw,5rem)] will-change-transform"
            >
              {OATH_FINAL.brand}
            </span>
          </p>
          <p className="mt-2 overflow-hidden" data-final-line>
            <span
              data-final-inner
              className="anvl-display block text-xs tracking-[0.3em] text-[var(--color-ember-bright)] will-change-transform"
            >
              {OATH_FINAL.tagline}
            </span>
          </p>
        </div>
      </Container>
    </section>
  )
}
