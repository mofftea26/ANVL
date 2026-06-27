import { Container } from '@/shared/components/ui/Container'
import { cn } from '@/shared/lib/cn'
import {
  OATH_BRAND_NAME,
  type OathResolvedContent,
} from '../content/oathContent.defaults'
import { sanitizeHref } from '@/shared/lib/url'
import { oathDefaultEmblem } from '../theOathAssets'
import { OathCtaLink } from './OathCtaLink'
import { OATH_FINALE_PRODUCTS_BLEND_MASK, OathSceneSeam } from './OathSceneSeam'

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
      className={cn(
        'relative flex w-full scroll-mt-[var(--anvl-header-h)] flex-col items-center overflow-hidden pt-20 pb-4 text-center md:pt-28 md:pb-6',
        OATH_FINALE_PRODUCTS_BLEND_MASK,
      )}
      aria-labelledby="oath-finale-heading"
    >
      {/* Top from products — subtle bg-feather on mobile/tablet; xl+ blend (alpha
          mask + transparent seam, no dark void band). */}
      <OathSceneSeam edges="top" tone="subtle" className="xl:hidden" />
      <OathSceneSeam edges="top" tone="blend" className="hidden xl:block" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-20%] z-[1] h-[55%]"
        style={{
          background:
            'radial-gradient(ellipse 32% 60% at 50% 100%, color-mix(in srgb, var(--anvl-bone, #E7E4DF) 4%, transparent), transparent 70%)',
        }}
      />

      <Container className="relative z-10 flex flex-col items-center">
        <div data-finale-crest data-reveal-m className="mb-4 will-change-transform">
          <div className="flex h-64 w-64 items-center justify-center md:h-72 md:w-72 xl:h-80 xl:w-80">
            {/* Sitewide Default emblem (CMS General → emblemFallback), filled in
                the theme text colour via a CSS mask so it reads as a solid crest
                regardless of the source asset's own colours. */}
            <span
              aria-hidden="true"
              className="inline-flex h-full w-full"
              style={{
                backgroundColor: 'var(--color-text)',
                maskImage: `url("${sanitizeHref(oathDefaultEmblem())}")`,
                WebkitMaskImage: `url("${sanitizeHref(oathDefaultEmblem())}")`,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                filter:
                  'drop-shadow(0 18px 26px rgba(0,0,0,0.6)) drop-shadow(0 6px 10px rgba(0,0,0,0.45)) drop-shadow(0 0 24px color-mix(in srgb, var(--color-text) 18%, transparent))',
              }}
            />
          </div>
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
