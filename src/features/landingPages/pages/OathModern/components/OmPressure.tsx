import type { OmResolvedContent } from '../content/oathModernContent.defaults'
import { OmChapterShell, OmEyebrow, OmHeading } from './OmPrimitives'

/**
 * Chapter II — Pressure. The forging forces, sworn as vows. Each vow is a struck
 * mark; on desktop the master timeline reveals them one at a time (M4), here they
 * stand as a composed list.
 */
export function OmPressure({ content }: { content: OmResolvedContent }) {
  const p = content.pressure
  return (
    <OmChapterShell chapter="pressure">
      <div className="max-w-2xl">
        <OmEyebrow>{p.eyebrow}</OmEyebrow>
        <OmHeading text={p.heading} className="mt-6 text-4xl sm:text-5xl" />
        <p
          data-om-reveal
          className="mt-6 text-pretty text-[0.98rem] leading-relaxed text-[color:var(--color-text-muted)]"
        >
          {p.body}
        </p>
      </div>

      <ol className="mt-14 grid gap-px overflow-hidden border border-[var(--color-line)] sm:grid-cols-2">
        {p.vows.map((vow, i) => (
          <li
            key={vow.id}
            data-om-reveal
            data-om-vow={vow.id}
            className="relative bg-[color:var(--color-surface)] px-7 py-9"
          >
            <span className="anvl-micro text-[0.62rem] uppercase tracking-[0.28em] text-[color:var(--color-text-muted)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="anvl-heading mt-3 text-2xl uppercase text-[color:var(--color-heading)]">
              {vow.label}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-muted)]">
              {vow.line}
            </p>
          </li>
        ))}
      </ol>
    </OmChapterShell>
  )
}
