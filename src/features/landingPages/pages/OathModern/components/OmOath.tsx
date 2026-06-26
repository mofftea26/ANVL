import type { OmResolvedContent } from '../content/oathModernContent.defaults'
import { OmEyebrow } from './OmPrimitives'

/**
 * Chapter IV — The Oath. The emotional centre: the sworn creed carved line by
 * line. On desktop this is the orbital camera moment (M4) over the persistent
 * canvas; statically it's a centered ceremonial passage. `id="oath"` is the
 * anchor target for the threshold's "Read the oath" CTA.
 */
export function OmOath({
  content,
  oathBackdrop,
}: {
  content: OmResolvedContent
  oathBackdrop: string | null
}) {
  const o = content.oath
  return (
    <section
      id="oath"
      data-om-chapter="oath"
      className="relative isolate overflow-hidden border-t border-[var(--color-line)] px-6 py-32 lg:px-12 lg:py-40"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {oathBackdrop ? (
          <img
            src={oathBackdrop}
            alt=""
            data-om-bleed
            className="h-full w-full object-cover opacity-25"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(80% 70% at 50% 40%, color-mix(in srgb, var(--hero-glow) 24%, transparent) 0%, var(--color-bg) 70%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <OmEyebrow>{o.eyebrow}</OmEyebrow>
        <h2 className="anvl-micro mt-5 text-[0.66rem] uppercase tracking-[0.4em] text-[color:var(--color-text-muted)]">
          {o.heading}
        </h2>
        <div className="mt-12 space-y-5">
          {o.lines.map((line, i) => (
            <p
              key={i}
              data-om-reveal
              data-om-oath-line={i}
              className="anvl-heading text-balance text-2xl uppercase leading-tight text-[color:var(--color-heading)] sm:text-3xl"
            >
              {line}
            </p>
          ))}
        </div>
        <p className="anvl-micro mt-12 text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          {o.attribution}
        </p>
      </div>
    </section>
  )
}
