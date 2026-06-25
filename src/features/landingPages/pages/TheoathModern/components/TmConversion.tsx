import type { TmResolvedContent } from '../content/theoathModernContent.defaults'
import { TmCtaLink } from './TmCtaLink'
import { TmSectionShell } from './TmPrimitives'

/**
 * Final conversion band — the strong close. Headline, body, primary/secondary
 * CTAs, and the brand tagline. The compression shirt remains the implied hero
 * via the primary CTA (defaults to the PDP).
 */
export function TmConversion({
  content,
  fogPlate = null,
}: {
  content: TmResolvedContent
  fogPlate?: string | null
}) {
  const { conversion } = content
  return (
    <TmSectionShell section="conversion" className="relative overflow-hidden text-center">
      {fogPlate ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <img
            data-tm-bleed
            src={fogPlate}
            alt=""
            className="h-[124%] w-full object-cover opacity-30"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[var(--color-bg)]/40" />
        </div>
      ) : null}
      <div className="mx-auto max-w-2xl">
        <p
          data-tm-reveal
          className="anvl-micro text-[0.7rem] uppercase tracking-[0.32em] text-[color:var(--color-text-muted)]"
        >
          {conversion.eyebrow}
        </p>
        <h2
          data-tm-heading
          data-tm-reveal-m
          className="anvl-heading mt-4 text-4xl uppercase leading-tight sm:text-5xl"
        >
          {conversion.title}
        </h2>
        <p data-tm-reveal className="mt-5 text-[color:var(--color-text-muted)]">
          {conversion.body}
        </p>
        <div
          data-tm-reveal
          className="mt-9 flex flex-wrap justify-center gap-3"
        >
          <TmCtaLink cta={conversion.primaryCta} kind="primary" />
          <TmCtaLink cta={conversion.secondaryCta} kind="secondary" />
        </div>
        <p className="anvl-display mt-12 text-sm uppercase tracking-[0.4em] text-[color:var(--color-text-muted)]">
          {conversion.tagline}
        </p>
      </div>
    </TmSectionShell>
  )
}
