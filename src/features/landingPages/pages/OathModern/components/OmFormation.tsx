import type { OmResolvedContent } from '../content/oathModernContent.defaults'
import { OmChapterShell, OmEyebrow, OmHeading } from './OmPrimitives'

/**
 * Chapter III — Formation. How the piece is forged, not sewn: construction marks
 * read against a fiber-level macro. The macro plate doubles as a "bleed" surface
 * for the chapter transition (M4).
 */
export function OmFormation({
  content,
  materialsMacro,
}: {
  content: OmResolvedContent
  materialsMacro: string | null
}) {
  const f = content.formation
  return (
    <OmChapterShell chapter="formation">
      <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="relative aspect-[4/5] overflow-hidden border border-[var(--color-line)]">
          {materialsMacro ? (
            <img
              src={materialsMacro}
              alt="Macro of the forged knit"
              data-om-bleed
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-surface-elevated) 70%, transparent) 0 2px, transparent 2px 6px)',
                backgroundColor: 'var(--color-surface)',
              }}
            />
          )}
        </div>

        <div>
          <OmEyebrow>{f.eyebrow}</OmEyebrow>
          <OmHeading text={f.heading} className="mt-6 text-4xl sm:text-5xl" />
          <p
            data-om-reveal
            className="mt-6 max-w-md text-pretty text-[0.98rem] leading-relaxed text-[color:var(--color-text-muted)]"
          >
            {f.body}
          </p>
          <dl className="mt-10 grid gap-px overflow-hidden border border-[var(--color-line)]">
            {f.marks.map((mark) => (
              <div
                key={mark.id}
                data-om-reveal
                className="bg-[color:var(--color-surface)] px-6 py-5"
              >
                <dt className="anvl-heading text-sm uppercase tracking-[0.08em] text-[color:var(--color-heading)]">
                  {mark.label}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text-muted)]">
                  {mark.line}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </OmChapterShell>
  )
}
