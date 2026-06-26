import type { OmResolvedContent } from '../content/oathModernContent.defaults'
import { OmCtaLink, OmEyebrow, OmHeading } from './OmPrimitives'

/**
 * Chapter VI — The Vow. The final buying moment with low visual friction:
 * headline, the two calls to action, and a thin reassurance rail (delivery /
 * returns / sizing) before the world releases into the global footer.
 */
export function OmConversion({
  content,
  atmospherePlate,
}: {
  content: OmResolvedContent
  atmospherePlate: string | null
}) {
  const c = content.conversion
  return (
    <section
      data-om-chapter="conversion"
      className="relative isolate overflow-hidden border-t border-[var(--color-line)] px-6 py-32 text-center lg:px-12 lg:py-40"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {atmospherePlate ? (
          <img
            src={atmospherePlate}
            alt=""
            data-om-bleed
            className="h-full w-full object-cover opacity-30"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(90% 80% at 50% 30%, color-mix(in srgb, var(--hero-glow) 30%, transparent) 0%, var(--color-bg) 68%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-2xl">
        <OmEyebrow>{c.eyebrow}</OmEyebrow>
        <OmHeading
          text={c.title}
          className="mt-6 text-5xl sm:text-6xl"
        />
        <p
          data-om-reveal
          className="mx-auto mt-6 max-w-md text-pretty text-[0.98rem] leading-relaxed text-[color:var(--color-text-muted)]"
        >
          {c.body}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <OmCtaLink href={c.primaryCta.href} tone="primary" data-om-magnetic>
            {c.primaryCta.label}
          </OmCtaLink>
          <OmCtaLink href={c.secondaryCta.href} tone="ghost">
            {c.secondaryCta.label}
          </OmCtaLink>
        </div>

        {c.reassurances.length > 0 ? (
          <ul className="mx-auto mt-12 flex max-w-lg flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {c.reassurances.map((line, i) => (
              <li
                key={i}
                className="anvl-micro text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-text-muted)]"
              >
                {line}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="anvl-heading mt-14 text-sm uppercase tracking-[0.34em] text-[color:var(--color-primary)]">
          {c.tagline}
        </p>
      </div>
    </section>
  )
}
